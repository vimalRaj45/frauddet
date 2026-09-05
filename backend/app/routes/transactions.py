from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import Transaction, SuspiciousTransaction
from app.schemas import (
    TransactionResponse,
    SuspiciousTransactionResponse,
    SimulateRequest,
    FraudEvaluationResult
)
from app.generator import generate_transaction, generate_velocity_burst
from app.kafka_producer import kafka_producer_client
from app.kafka_consumer import process_and_save_transaction
from app.mistral_service import mistral_ai_service
from app.routes.stats import get_dashboard_stats

router = APIRouter(prefix="/api", tags=["Transactions"])

@router.get("/transactions", response_model=List[TransactionResponse])
def get_normal_transactions(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Fetch normal classified transactions"""
    return db.query(Transaction).order_by(desc(Transaction.timestamp)).offset(offset).limit(limit).all()

@router.get("/suspicious-transactions", response_model=List[SuspiciousTransactionResponse])
def get_suspicious_transactions(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None, # 'SUSPICIOUS' or 'FRAUD'
    db: Session = Depends(get_db)
):
    """Fetch suspicious or fraudulent classified transactions"""
    query = db.query(SuspiciousTransaction)
    if status:
        query = query.filter(SuspiciousTransaction.status == status.upper())
    return query.order_by(desc(SuspiciousTransaction.timestamp)).offset(offset).limit(limit).all()

@router.get("/feed")
def get_unified_live_feed(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetch combined recent transactions stream (Normal, Suspicious, Fraud)"""
    normals = db.query(Transaction).order_by(desc(Transaction.timestamp)).limit(limit).all()
    suspicious = db.query(SuspiciousTransaction).order_by(desc(SuspiciousTransaction.timestamp)).limit(limit).all()

    combined = []
    for n in normals:
        combined.append({
            "id": n.id,
            "transaction_id": n.transaction_id,
            "user_id": n.user_id,
            "account_id": n.account_id,
            "amount": n.amount,
            "currency": n.currency,
            "merchant": n.merchant,
            "category": n.category,
            "location": n.location,
            "device_type": n.device_type,
            "risk_score": n.risk_score,
            "status": n.status,
            "fraud_reasons": None,
            "timestamp": n.timestamp.isoformat() if n.timestamp else None
        })

    for s in suspicious:
        combined.append({
            "id": s.id,
            "transaction_id": s.transaction_id,
            "user_id": s.user_id,
            "account_id": s.account_id,
            "amount": s.amount,
            "currency": s.currency,
            "merchant": s.merchant,
            "category": s.category,
            "location": s.location,
            "device_type": s.device_type,
            "risk_score": s.risk_score,
            "status": s.status,
            "fraud_reasons": s.fraud_reasons,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None
        })

    combined.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return combined[:limit]

@router.post("/simulate", response_model=List[FraudEvaluationResult])
def simulate_transactions(
    req: SimulateRequest,
    db: Session = Depends(get_db)
):
    """Simulates transactions across attack vectors"""
    results = []

    if req.scenario == "VELOCITY_SPIKE":
        burst = generate_velocity_burst(count=max(req.count or 4, 3))
        for txn_data in burst:
            sent_to_kafka = kafka_producer_client.send_transaction(txn_data)
            res = process_and_save_transaction(db, txn_data)
            results.append(res)
    else:
        count = max(1, min(req.count or 1, 20))
        for _ in range(count):
            txn_data = generate_transaction(scenario=req.scenario or "RANDOM")
            sent_to_kafka = kafka_producer_client.send_transaction(txn_data)
            res = process_and_save_transaction(db, txn_data)
            results.append(res)

    return results

@router.post("/ai/analyze")
def analyze_transaction_with_mistral(txn_data: Dict[str, Any] = Body(...)):
    """Deep forensic transaction analysis powered by Mistral AI"""
    return mistral_ai_service.analyze_transaction(txn_data)

@router.get("/ai/briefing")
def get_portfolio_ai_briefing(db: Session = Depends(get_db)):
    """Executive CISO AI briefing generated from live Neon metrics"""
    stats_data = get_dashboard_stats(db).model_dump()
    briefing_text = mistral_ai_service.generate_portfolio_summary(stats_data)
    return {
        "briefing": briefing_text,
        "model": mistral_ai_service.model,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/ip-lookup")
def get_ip_geolocation_details(ip: str = Query(..., description="IP address to lookup")):
    """Resolves IP Geolocation, country, city, and proxy/datacenter indicators"""
    from app.ip_geo_service import lookup_ip_geolocation
    return lookup_ip_geolocation(ip)

@router.post("/clear")
def clear_database_records(db: Session = Depends(get_db)):
    """Wipes transactions for testing / fresh demo state"""
    db.query(Transaction).delete()
    db.query(SuspiciousTransaction).delete()
    db.commit()
    return {"message": "All transaction records cleared successfully"}
