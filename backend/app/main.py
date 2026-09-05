import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.kafka_consumer import kafka_consumer_service
from app.kafka_producer import kafka_producer_client
from app.routes import stats, transactions, mock_bank, external_ingest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fraud_detector.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up FinTech Fraud Detection Engine...")
    logger.info("Initializing database tables...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    # Start Kafka Consumer background worker
    if settings.KAFKA_BOOTSTRAP_SERVERS:
        logger.info("Starting Aiven Kafka consumer worker...")
        kafka_consumer_service.start()
    else:
        logger.info("Kafka bootstrap servers not set. Running in direct simulation mode.")

    yield

    # Shutdown
    logger.info("Shutting down FinTech Fraud Detection Engine...")
    kafka_consumer_service.stop()
    kafka_producer_client.close()

app = FastAPI(
    title="FinTech Real-Time Fraud Detection API",
    description="Real-time transaction scoring and fraud detection backend with Neon PostgreSQL, Aiven Kafka, and Mistral AI.",
    version="1.1.0",
    lifespan=lifespan
)

# CORS setup for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(stats.router)
app.include_router(transactions.router)
app.include_router(external_ingest.router)
app.include_router(mock_bank.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "kafka_connected": kafka_producer_client.connected,
        "database_configured": bool(settings.DATABASE_URL),
        "mistral_configured": bool(settings.MISTRAL_API_KEY)
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to the Real-Time FinTech Fraud Detection API",
        "docs": "/docs",
        "health": "/health",
        "mock_bank_feed": "/mock-bank/feed"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
