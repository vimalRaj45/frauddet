from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    account_id = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    merchant = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    location = Column(String(128), nullable=False)
    ip_address = Column(String(64), nullable=True)
    device_type = Column(String(32), nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(String(32), default="NORMAL")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SuspiciousTransaction(Base):
    __tablename__ = "suspicious_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    account_id = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    merchant = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    location = Column(String(128), nullable=False)
    ip_address = Column(String(64), nullable=True)
    device_type = Column(String(32), nullable=True)
    risk_score = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False) # 'SUSPICIOUS' or 'FRAUD'
    fraud_reasons = Column(Text, nullable=False) # JSON or semicolon/comma-separated strings
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
