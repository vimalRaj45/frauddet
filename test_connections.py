import os
import sys
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv("backend/.env")
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "fintech.transactions")
KAFKA_SASL_USERNAME = os.getenv("KAFKA_SASL_USERNAME")
KAFKA_SASL_PASSWORD = os.getenv("KAFKA_SASL_PASSWORD")

print("=" * 65)
print(" 🔍 FinTech Fraud Detection — Cloud Connections Diagnostic Tool")
print("=" * 65)

# ----------------------------------------------------------------
# 1. Test Neon PostgreSQL Connection
# ----------------------------------------------------------------
print("\n[1/2] Testing Neon PostgreSQL Connection...")
if not DATABASE_URL:
    print(" ❌ DATABASE_URL is not set in .env file.")
else:
    try:
        from sqlalchemy import create_engine, text
        db_url = DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        if "sslmode" not in db_url and "neon.tech" in db_url:
            db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"

        engine = create_engine(db_url, connect_args={"connect_timeout": 8})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT current_database(), version(), now();")).fetchone()
            db_name = result[0]
            version = result[1].split()[0] + " " + result[1].split()[1]
            server_time = result[2]
            
            print(" ✅ Neon PostgreSQL Connected Successfully!")
            print(f"    • Database : {db_name}")
            print(f"    • Version  : {version}")
            print(f"    • DB Time  : {server_time}")

            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('transactions', 'suspicious_transactions');
            """)
            tables = [row[0] for row in conn.execute(tables_query).fetchall()]
            print(f"    • Tables   : {', '.join(tables) if tables else 'None (auto-created on start)'}")

            if "transactions" in tables:
                t_count = conn.execute(text("SELECT count(*) FROM transactions;")).scalar()
                s_count = conn.execute(text("SELECT count(*) FROM suspicious_transactions;")).scalar()
                print(f"    • Records  : {t_count} normal transactions, {s_count} flagged suspicious/fraud")

    except Exception as e:
        print(f" ❌ Neon Connection Error: {e}")

# ----------------------------------------------------------------
# 2. Test Aiven Kafka REST & Stream Connection
# ----------------------------------------------------------------
print("\n[2/2] Testing Aiven Kafka REST Connection...")
if not KAFKA_BOOTSTRAP_SERVERS:
    print(" ⚠️ KAFKA_BOOTSTRAP_SERVERS is not set in .env.")
else:
    host_clean = KAFKA_BOOTSTRAP_SERVERS.replace("https://", "").replace("http://", "").split("/")[0]
    rest_url = f"https://{host_clean}/topics"
    auth = (KAFKA_SASL_USERNAME, KAFKA_SASL_PASSWORD)

    try:
        res = requests.get(rest_url, auth=auth, timeout=8)
        if res.status_code == 200:
            topics = res.json()
            print(" ✅ Aiven Kafka REST API Connected Successfully!")
            print(f"    • Service  : https://{host_clean}")
            print(f"    • User     : {KAFKA_SASL_USERNAME}")
            print(f"    • Topics   : {topics if topics else '[] (No topics created yet)'}")

            if KAFKA_TOPIC not in topics:
                print(f"\n 💡 Action Item for Topic Creation:")
                print(f"    In Aiven Console (left sidebar) -> Click 'Topics' -> 'Create Topic'")
                print(f"    Name: '{KAFKA_TOPIC}' -> Click 'Create'")
        else:
            print(f" ⚠️ Aiven REST HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f" ⚠️ Aiven REST Notice: {e}")

print("\n" + "=" * 65)
