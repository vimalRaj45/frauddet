import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, Body, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.kafka_producer import kafka_producer_client
from app.kafka_consumer import process_and_save_transaction

router = APIRouter(prefix="/mock-bank", tags=["Mock Core Banking API"])

MOCK_ACCOUNTS = [
    {"account_id": "BANK-ACC-101", "holder_name": "Alexander Hayes", "tier": "Platinum", "balance": 84500.00, "status": "ACTIVE"},
    {"account_id": "BANK-ACC-102", "holder_name": "Sophia Vance", "tier": "Gold", "balance": 12400.50, "status": "ACTIVE"},
    {"account_id": "BANK-ACC-103", "holder_name": "Marcus Sterling", "tier": "Diamond", "balance": 340000.00, "status": "FLAGGED_VIP"},
    {"account_id": "BANK-ACC-104", "holder_name": "Elena Rostova", "tier": "Standard", "balance": 3150.25, "status": "ACTIVE"},
    {"account_id": "BANK-ACC-105", "holder_name": "Hiroshi Tanaka", "tier": "Gold", "balance": 45200.00, "status": "ACTIVE"},
    {"account_id": "BANK-ACC-106", "holder_name": "Chloe Dupont", "tier": "Standard", "balance": 1820.00, "status": "ACTIVE"}
]

MERCHANTS_BY_TYPE = {
    "RETAIL": [
        ("Amazon.com Payment", "Electronics & Retail", "Seattle, USA"),
        ("Apple Store Online", "Tech & Hardware", "Cupertino, USA"),
        ("Whole Foods Market", "Groceries", "Austin, USA"),
        ("Target Stores", "General Merchandise", "Minneapolis, USA")
    ],
    "HIGH_RISK": [
        ("VegasBet Online Casino", "Online Casino / Gambling", "Panama"),
        ("CryptoExchange Global Wire", "Cryptocurrency Exchange", "Cayman Islands"),
        ("Prestige Watches Geneva", "Luxury Jewelry", "Zurich, Switzerland"),
        ("SwiftOffshore Express Transfer", "Wire Transfer Service", "Seychelles")
    ]
}

@router.get("/accounts")
def get_mock_accounts():
    """Returns simulated Core Banking customer accounts ledger"""
    return {
        "institution": "Global Apex Core Banking",
        "system_status": "ONLINE",
        "accounts": MOCK_ACCOUNTS
    }

@router.get("/feed")
def generate_mock_banking_feed(
    count: int = Query(5, ge=1, le=50),
    include_fraud_ratio: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    Simulates a live Core Banking Ledger Transaction Feed.
    Returns a batch of formatted transactions with timestamps, accounts, and realistic merchant metadata.
    """
    transactions = []
    base_time = datetime.utcnow()

    for i in range(count):
        account = random.choice(MOCK_ACCOUNTS)
        is_high_risk = (random.random() < include_fraud_ratio)
        
        if is_high_risk:
            merchant_name, category, location = random.choice(MERCHANTS_BY_TYPE["HIGH_RISK"])
            amount = round(random.uniform(5500.00, 22000.00), 2)
            device = random.choice(["API Gateway Bot", "Tor Proxy Client", "Emulated Android"])
            ip = f"185.{random.randint(100, 240)}.{random.randint(10, 200)}.{random.randint(1, 254)}"
        else:
            merchant_name, category, location = random.choice(MERCHANTS_BY_TYPE["RETAIL"])
            amount = round(random.uniform(12.50, 480.00), 2)
            device = random.choice(["iOS App v4.2", "Web Banking Portal", "POS Terminal"])
            ip = f"192.168.{random.randint(1, 100)}.{random.randint(1, 254)}"

        txn_time = base_time - timedelta(seconds=(count - i) * 3)

        transactions.append({
            "transaction_id": f"BANK-TXN-{uuid.uuid4().hex[:8].upper()}",
            "user_id": f"CUST-{account['account_id'].split('-')[-1]}",
            "account_id": account["account_id"],
            "amount": amount,
            "currency": "USD",
            "merchant": merchant_name,
            "category": category,
            "location": location,
            "ip_address": ip,
            "device_type": device,
            "timestamp": txn_time.isoformat(),
            "core_ledger_reference": f"GL-REF-{uuid.uuid4().hex[:6].upper()}"
        })

    return {
        "status": "SUCCESS",
        "source": "Apex Core Banking System (Mock API)",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": len(transactions),
        "transactions": transactions
    }

@router.post("/webhook/trigger")
def trigger_mock_payment_webhook(
    payload: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Simulates an incoming real-time payment gateway webhook (e.g. Stripe / Adyen / Visa Direct).
    Automatically pushes to Aiven Kafka and evaluates fraud immediately.
    """
    if not payload:
        # Default mock webhook payload
        account = random.choice(MOCK_ACCOUNTS)
        merchant_name, category, location = random.choice(MERCHANTS_BY_TYPE["HIGH_RISK"])
        payload = {
            "transaction_id": f"WH-TXN-{uuid.uuid4().hex[:8].upper()}",
            "user_id": f"CUST-{account['account_id'].split('-')[-1]}",
            "account_id": account["account_id"],
            "amount": round(random.uniform(7500.00, 18500.00), 2),
            "currency": "USD",
            "merchant": merchant_name,
            "category": category,
            "location": location,
            "ip_address": "185.220.101.44",
            "device_type": "Payment Gateway Webhook",
            "timestamp": datetime.utcnow().isoformat()
        }

    # Stream to Kafka & Process
    sent_to_kafka = kafka_producer_client.send_transaction(payload)
    eval_result = process_and_save_transaction(db, payload)

    return {
        "status": "PROCESSED",
        "webhook_delivery_id": f"DELIV-{uuid.uuid4().hex[:10].upper()}",
        "kafka_streamed": sent_to_kafka,
        "evaluation": eval_result
    }
