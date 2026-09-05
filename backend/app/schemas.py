from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    user_id: str
    account_id: str
    amount: float
    currency: str = "USD"
    merchant: str
    category: str
    location: str
    ip_address: Optional[str] = "127.0.0.1"
    device_type: Optional[str] = "Mobile"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    risk_score: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SuspiciousTransactionResponse(TransactionBase):
    id: int
    risk_score: int
    status: str
    fraud_reasons: str
    created_at: datetime

    class Config:
        from_attributes = True

class FraudEvaluationResult(BaseModel):
    transaction_id: str
    risk_score: int
    status: str # NORMAL, SUSPICIOUS, FRAUD
    fraud_reasons: List[str]
    is_fraud: bool
    is_suspicious: bool

class StatsResponse(BaseModel):
    total_transactions: int
    normal_count: int
    suspicious_count: int
    fraud_count: int
    total_flagged_count: int
    total_volume_usd: float
    flagged_volume_usd: float
    average_risk_score: float
    fraud_rate_percentage: float
    recent_trend: List[Dict[str, Any]] = []

class SimulateRequest(BaseModel):
    scenario: Optional[str] = "RANDOM" # RANDOM, NORMAL, HIGH_AMOUNT, VELOCITY_SPIKE, FOREIGN_LOCATION, OFF_HOURS_SPIKE
    count: Optional[int] = 1
