import csv
import io
import uuid
import logging
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.kafka_producer import kafka_producer_client
from app.kafka_consumer import process_and_save_transaction

logger = logging.getLogger("fraud_detector.external_ingest")
router = APIRouter(prefix="/api", tags=["External Ingestion & CSV"])

def normalize_csv_row(row: dict) -> dict:
    """Normalizes various common CSV column header names into standard schema"""
    def find_val(keys: List[str], default: Any = None):
        for k in keys:
            for rk in row:
                if rk.strip().lower() == k.lower():
                    val = row[rk]
                    if val is not None and str(val).strip() != "":
                        return str(val).strip()
        return default

    txn_id = find_val(["transaction_id", "txn_id", "id", "trans_id"], f"CSV-{uuid.uuid4().hex[:8].upper()}")
    user_id = find_val(["user_id", "user", "customer_id", "cust_id"], "USR-CSV")
    account_id = find_val(["account_id", "account", "card_number", "acc_id"], "ACC-CSV-01")
    
    amount_raw = find_val(["amount", "amt", "value", "price"], "100.00")
    try:
        amount = float(str(amount_raw).replace("$", "").replace(",", "").strip())
    except Exception:
        amount = 100.0

    currency = find_val(["currency", "curr"], "USD")
    merchant = find_val(["merchant", "merchant_name", "store", "vendor"], "Retail Vendor")
    category = find_val(["category", "cat", "industry", "type"], "General Merchandise")
    location = find_val(["location", "loc", "city", "country"], "New York, USA")
    ip_address = find_val(["ip_address", "ip", "client_ip"], "127.0.0.1")
    device_type = find_val(["device_type", "device", "channel"], "Web")
    
    timestamp_raw = find_val(["timestamp", "time", "date", "created_at"], None)
    if timestamp_raw:
        try:
            timestamp = datetime.fromisoformat(timestamp_raw.replace("Z", "+00:00")).isoformat()
        except Exception:
            timestamp = datetime.utcnow().isoformat()
    else:
        timestamp = datetime.utcnow().isoformat()

    return {
        "transaction_id": txn_id,
        "user_id": user_id,
        "account_id": account_id,
        "amount": amount,
        "currency": currency,
        "merchant": merchant,
        "category": category,
        "location": location,
        "ip_address": ip_address,
        "device_type": device_type,
        "timestamp": timestamp
    }

@router.post("/upload-csv")
async def upload_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a CSV file containing transactions.
    Each transaction is streamed to Kafka (if configured), evaluated against fraud rules,
    and persisted to Neon PostgreSQL.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers.")

    processed_records = []
    normal_count = 0
    suspicious_count = 0
    fraud_count = 0

    for index, raw_row in enumerate(reader):
        if not raw_row or all(v is None or v.strip() == "" for v in raw_row.values()):
            continue

        txn_dict = normalize_csv_row(raw_row)
        
        # Publish to Kafka
        kafka_producer_client.send_transaction(txn_dict)
        
        # Evaluate & Save to DB
        eval_result = process_and_save_transaction(db, txn_dict)
        processed_records.append(eval_result)

        if eval_result["status"] == "NORMAL":
            normal_count += 1
        elif eval_result["status"] == "SUSPICIOUS":
            suspicious_count += 1
        elif eval_result["status"] == "FRAUD":
            fraud_count += 1

    return {
        "status": "SUCCESS",
        "filename": file.filename,
        "total_processed": len(processed_records),
        "normal_count": normal_count,
        "suspicious_count": suspicious_count,
        "fraud_count": fraud_count,
        "results": processed_records
    }

@router.get("/csv-template")
def download_sample_csv_template():
    """Generates and returns a downloadable sample CSV template"""
    sample_rows = [
        "transaction_id,user_id,account_id,amount,currency,merchant,category,location,ip_address,device_type",
        "TXN-SAMPLE-101,USR-9901,ACC-8821,48.50,USD,Whole Foods Market,Groceries,New York USA,192.168.1.5,iOS App",
        "TXN-SAMPLE-102,USR-9902,ACC-4410,14500.00,USD,Cartier Boutique,Luxury Jewelry,Cayman Islands,185.220.101.4,API Bot",
        "TXN-SAMPLE-103,USR-9903,ACC-7733,8999.00,USD,VegasBet Casino,Online Casino / Gambling,Panama,185.220.101.9,MacOS",
        "TXN-SAMPLE-104,USR-9904,ACC-1120,120.00,USD,Apple Store,Tech & Hardware,San Francisco USA,192.168.2.14,Chrome Browser",
        "TXN-SAMPLE-105,USR-9905,ACC-5590,9500.00,USD,Binance Global,Cryptocurrency Exchange,Unknown / Tor Proxy,185.220.101.12,API Bot"
    ]
    csv_content = "\n".join(sample_rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fintech_transactions_sample.csv"}
    )

@router.post("/connect-external-api")
def connect_and_ingest_external_api(
    url: str = Body(..., embed=True),
    headers: Optional[Dict[str, str]] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Connects to any external REST API endpoint (e.g. Mock Core Bank or third-party payment system),
    fetches transactions, normalizes them, and streams them into the fraud pipeline.
    """
    try:
        req_headers = headers or {}
        response = requests.get(url, headers=req_headers, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"External API returned status code {response.status_code}: {response.text[:200]}"
            )

        data = response.json()
        
        # Extract list of transactions from various API payload structures
        txns_list = []
        if isinstance(data, list):
            txns_list = data
        elif isinstance(data, dict):
            for key in ["transactions", "data", "records", "items", "results"]:
                if key in data and isinstance(data[key], list):
                    txns_list = data[key]
                    break
            if not txns_list and "transaction_id" in data:
                txns_list = [data]

        if not txns_list:
            return {
                "status": "SUCCESS",
                "message": "Connected to API successfully, but no transactions array was found.",
                "total_processed": 0,
                "results": []
            }

        processed_records = []
        normal_count = 0
        suspicious_count = 0
        fraud_count = 0

        for raw_item in txns_list:
            if not isinstance(raw_item, dict):
                continue
            txn_dict = normalize_csv_row(raw_item)
            kafka_producer_client.send_transaction(txn_dict)
            eval_result = process_and_save_transaction(db, txn_dict)
            processed_records.append(eval_result)

            if eval_result["status"] == "NORMAL":
                normal_count += 1
            elif eval_result["status"] == "SUSPICIOUS":
                suspicious_count += 1
            elif eval_result["status"] == "FRAUD":
                fraud_count += 1

        return {
            "status": "SUCCESS",
            "source_url": url,
            "total_processed": len(processed_records),
            "normal_count": normal_count,
            "suspicious_count": suspicious_count,
            "fraud_count": fraud_count,
            "results": processed_records
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to reach external API: {str(e)}")

@router.post("/webhook/transaction")
def generic_webhook_receiver(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """General payment gateway webhook receiver"""
    txn_dict = normalize_csv_row(payload)
    kafka_producer_client.send_transaction(txn_dict)
    eval_result = process_and_save_transaction(db, txn_dict)
    return {
        "status": "ACCEPTED",
        "webhook_id": f"WH-ACK-{uuid.uuid4().hex[:8].upper()}",
        "processed": eval_result
    }
