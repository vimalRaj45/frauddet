import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "FinTech Real-Time Fraud Detection Engine"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Neon PostgreSQL Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fraud_detection.db")
    
    # Aiven Kafka Settings
    KAFKA_BOOTSTRAP_SERVERS: Optional[str] = os.getenv("KAFKA_BOOTSTRAP_SERVERS", None)
    KAFKA_TOPIC: str = os.getenv("KAFKA_TOPIC", "fintech.transactions")
    KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "fraud-detection-group")
    
    # Aiven Kafka Security
    KAFKA_SECURITY_PROTOCOL: str = os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL")
    KAFKA_SSL_CAFILE: Optional[str] = os.getenv("KAFKA_SSL_CAFILE", None)
    KAFKA_SSL_CERTFILE: Optional[str] = os.getenv("KAFKA_SSL_CERTFILE", None)
    KAFKA_SSL_KEYFILE: Optional[str] = os.getenv("KAFKA_SSL_KEYFILE", None)
    
    # SASL Authentication
    KAFKA_SASL_MECHANISM: str = os.getenv("KAFKA_SASL_MECHANISM", "PLAIN")
    KAFKA_SASL_USERNAME: Optional[str] = os.getenv("KAFKA_SASL_USERNAME", None)
    KAFKA_SASL_PASSWORD: Optional[str] = os.getenv("KAFKA_SASL_PASSWORD", None)

    # Mistral AI Settings
    MISTRAL_API_KEY: Optional[str] = os.getenv("MISTRAL_API_KEY", None)
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

    # Simulation mode fallback
    ENABLE_KAFKA_MOCK_FALLBACK: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
