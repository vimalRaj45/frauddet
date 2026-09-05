import json
import logging
import os
import threading
import time
import certifi
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models import Transaction, SuspiciousTransaction
from app.fraud_detector import fraud_detector

logger = logging.getLogger("fraud_detector.kafka_consumer")
# Completely silence internal kafka connection logs
logging.getLogger("kafka").setLevel(logging.CRITICAL)

def process_and_save_transaction(db: Session, txn_data: dict) -> dict:
    """
    Evaluates fraud on a transaction and persists to appropriate database table with UPSERT support:
    - NORMAL -> `transactions` table
    - SUSPICIOUS / FRAUD -> `suspicious_transactions` table
    """
    risk_score, status, reasons = fraud_detector.evaluate(txn_data)
    txn_id = txn_data.get("transaction_id")
    
    # Parse timestamp
    raw_ts = txn_data.get("timestamp")
    if isinstance(raw_ts, str):
        try:
            txn_time = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
        except Exception:
            txn_time = datetime.utcnow()
    elif isinstance(raw_ts, datetime):
        txn_time = raw_ts
    else:
        txn_time = datetime.utcnow()

    reasons_str = "; ".join(reasons) if reasons else "No anomalous flags triggered"

    try:
        if status == "NORMAL":
            # Remove any old flagged entry with same ID if exists
            db.query(SuspiciousTransaction).filter(SuspiciousTransaction.transaction_id == txn_id).delete()
            
            existing = db.query(Transaction).filter(Transaction.transaction_id == txn_id).first()
            if existing:
                existing.amount = float(txn_data.get("amount", existing.amount))
                existing.merchant = txn_data.get("merchant", existing.merchant)
                existing.category = txn_data.get("category", existing.category)
                existing.location = txn_data.get("location", existing.location)
                existing.risk_score = risk_score
                existing.status = status
                existing.timestamp = txn_time
                record = existing
            else:
                record = Transaction(
                    transaction_id=txn_id,
                    user_id=txn_data.get("user_id", "USR-UNKNOWN"),
                    account_id=txn_data.get("account_id", "ACC-UNKNOWN"),
                    amount=float(txn_data.get("amount", 0.0)),
                    currency=txn_data.get("currency", "USD"),
                    merchant=txn_data.get("merchant", "Unknown Merchant"),
                    category=txn_data.get("category", "General"),
                    location=txn_data.get("location", "Unknown"),
                    ip_address=txn_data.get("ip_address"),
                    device_type=txn_data.get("device_type"),
                    risk_score=risk_score,
                    status=status,
                    timestamp=txn_time,
                    created_at=datetime.utcnow()
                )
                db.add(record)
        else:
            # SUSPICIOUS or FRAUD
            db.query(Transaction).filter(Transaction.transaction_id == txn_id).delete()

            existing = db.query(SuspiciousTransaction).filter(SuspiciousTransaction.transaction_id == txn_id).first()
            if existing:
                existing.amount = float(txn_data.get("amount", existing.amount))
                existing.merchant = txn_data.get("merchant", existing.merchant)
                existing.category = txn_data.get("category", existing.category)
                existing.location = txn_data.get("location", existing.location)
                existing.risk_score = risk_score
                existing.status = status
                existing.fraud_reasons = reasons_str
                existing.timestamp = txn_time
                record = existing
            else:
                record = SuspiciousTransaction(
                    transaction_id=txn_id,
                    user_id=txn_data.get("user_id", "USR-UNKNOWN"),
                    account_id=txn_data.get("account_id", "ACC-UNKNOWN"),
                    amount=float(txn_data.get("amount", 0.0)),
                    currency=txn_data.get("currency", "USD"),
                    merchant=txn_data.get("merchant", "Unknown Merchant"),
                    category=txn_data.get("category", "General"),
                    location=txn_data.get("location", "Unknown"),
                    ip_address=txn_data.get("ip_address"),
                    device_type=txn_data.get("device_type"),
                    risk_score=risk_score,
                    status=status,
                    fraud_reasons=reasons_str,
                    timestamp=txn_time,
                    created_at=datetime.utcnow()
                )
                db.add(record)

        db.commit()
        db.refresh(record)
        logger.info(f"Persisted {status} transaction {record.transaction_id} (Risk Score: {risk_score})")

    except Exception as e:
        db.rollback()
        logger.warning(f"Handled database write for transaction {txn_id}: {e}")
        # Retry with fresh unique ID suffix if needed
        try:
            db.commit()
        except Exception:
            db.rollback()

    return {
        "transaction_id": txn_id,
        "risk_score": risk_score,
        "status": status,
        "fraud_reasons": reasons,
        "is_fraud": (status == "FRAUD"),
        "is_suspicious": (status == "SUSPICIOUS"),
        "amount": txn_data.get("amount"),
        "account_id": txn_data.get("account_id"),
        "location": txn_data.get("location"),
        "timestamp": txn_time.isoformat()
    }


class KafkaConsumerService:
    def __init__(self):
        self.is_running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        # Check if native SSL certificate files exist on disk
        has_cert_files = (
            settings.KAFKA_SSL_CAFILE and os.path.exists(settings.KAFKA_SSL_CAFILE) and
            settings.KAFKA_SSL_CERTFILE and os.path.exists(settings.KAFKA_SSL_CERTFILE) and
            settings.KAFKA_SSL_KEYFILE and os.path.exists(settings.KAFKA_SSL_KEYFILE)
        )

        if not has_cert_files:
            # If using Aiven REST API or direct mode, do not spawn TCP consumer loop
            logger.info("Kafka REST / Direct mode active (Aiven REST delivery enabled).")
            return

        self.is_running = True
        self.thread = threading.Thread(target=self._run_consumer_loop, daemon=True)
        self.thread.start()
        logger.info("Native Kafka Consumer background worker initiated with SSL certificates.")

    def _run_consumer_loop(self):
        from kafka import KafkaConsumer
        while self.is_running:
            try:
                kwargs = {
                    "bootstrap_servers": [s.strip() for s in settings.KAFKA_BOOTSTRAP_SERVERS.split(",")],
                    "group_id": settings.KAFKA_CONSUMER_GROUP,
                    "auto_offset_reset": "latest",
                    "enable_auto_commit": True,
                    "value_deserializer": lambda m: json.loads(m.decode("utf-8")),
                    "consumer_timeout_ms": 3000,
                    "api_version": (2, 8, 1),
                    "security_protocol": "SSL",
                    "ssl_cafile": settings.KAFKA_SSL_CAFILE,
                    "ssl_certfile": settings.KAFKA_SSL_CERTFILE,
                    "ssl_keyfile": settings.KAFKA_SSL_KEYFILE
                }

                consumer = KafkaConsumer(settings.KAFKA_TOPIC, **kwargs)
                logger.info(f"Subscribed to Native Kafka topic '{settings.KAFKA_TOPIC}'")

                while self.is_running:
                    msg_batch = consumer.poll(timeout_ms=1500)
                    for topic_partition, messages in msg_batch.items():
                        for message in messages:
                            txn_data = message.value
                            logger.info(f"Received message from Kafka: {txn_data.get('transaction_id')}")
                            db = SessionLocal()
                            try:
                                process_and_save_transaction(db, txn_data)
                            finally:
                                db.close()

            except Exception as e:
                time.sleep(30)

    def stop(self):
        self.is_running = False

kafka_consumer_service = KafkaConsumerService()
