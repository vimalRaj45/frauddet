from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Transaction, SuspiciousTransaction
from app.schemas import StatsResponse

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("", response_model=StatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Normal counts and volume
    normal_count = db.query(func.count(Transaction.id)).scalar() or 0
    normal_volume = db.query(func.sum(Transaction.amount)).scalar() or 0.0
    normal_risk_sum = db.query(func.sum(Transaction.risk_score)).scalar() or 0

    # Suspicious and Fraud breakdown
    suspicious_count = db.query(func.count(SuspiciousTransaction.id)).filter(
        SuspiciousTransaction.status == "SUSPICIOUS"
    ).scalar() or 0

    fraud_count = db.query(func.count(SuspiciousTransaction.id)).filter(
        SuspiciousTransaction.status == "FRAUD"
    ).scalar() or 0

    flagged_volume = db.query(func.sum(SuspiciousTransaction.amount)).scalar() or 0.0
    flagged_risk_sum = db.query(func.sum(SuspiciousTransaction.risk_score)).scalar() or 0

    total_transactions = normal_count + suspicious_count + fraud_count
    total_flagged = suspicious_count + fraud_count
    total_volume = float(normal_volume + flagged_volume)
    
    avg_risk = 0.0
    if total_transactions > 0:
        avg_risk = round((normal_risk_sum + flagged_risk_sum) / total_transactions, 1)

    fraud_rate = 0.0
    if total_transactions > 0:
        fraud_rate = round((total_flagged / total_transactions) * 100, 2)

    # Risk Distribution Buckets for Charts
    risk_distribution = [
        {"name": "Low Risk (0-39)", "count": normal_count, "color": "#10B981"},
        {"name": "Medium Risk (40-69)", "count": suspicious_count, "color": "#F59E0B"},
        {"name": "Critical Fraud (70-100)", "count": fraud_count, "color": "#EF4444"}
    ]

    return StatsResponse(
        total_transactions=total_transactions,
        normal_count=normal_count,
        suspicious_count=suspicious_count,
        fraud_count=fraud_count,
        total_flagged_count=total_flagged,
        total_volume_usd=round(total_volume, 2),
        flagged_volume_usd=round(float(flagged_volume), 2),
        average_risk_score=avg_risk,
        fraud_rate_percentage=fraud_rate,
        recent_trend=risk_distribution
    )
