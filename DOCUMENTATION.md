# FinShield — Real-Time FinTech Fraud Detection System
## Complete Top-to-Bottom System Architecture, Engine & Deployment Documentation

---

## 1. Executive Overview

**FinShield** is an event-driven, production-ready FinTech Fraud Detection & Risk Scoring Platform. It ingests financial transactions in real-time through multiple channels (Synthetic Generators, Batch CSV Files, Core Banking APIs, Payment Webhooks), streams data through **Aiven Kafka**, evaluates each transaction against a **4-Factor Fraud Scoring Engine (Risk Score 0–100)**, conducts AI deep-dive forensic analysis via **Mistral AI**, persists normal vs. fraudulent transactions into **Neon PostgreSQL**, and displays real-time security analytics on a **React + Tailwind + Bootstrap Icons** dashboard.

---

## 2. End-to-End System Architecture

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │                    Data Ingestion Layer                     │
                               └───────┬──────────────┬──────────────┬───────────────┬───────┘
                                       │              │              │               │
                              [Synthetic Generator] [CSV Upload] [External API] [Mock Core Bank]
                              (Attack Vectors)     (Batch Engine)(REST Collector)(Ledger & Webhooks)
                                       │              │              │               │
                                       └──────────────┴──────┬───────┴───────────────┘
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │       Aiven Kafka Broker        │
                                            │  Topic: `fintech.transactions`  │
                                            │    (REST Proxy / SASL_SSL)      │
                                            └────────────────┬────────────────┘
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │   FastAPI Python Rule Engine    │
                                            │  (Amount, Velocity, Geo, Time)  │
                                            │       Risk Score (0–100)        │
                                            └────────────────┬────────────────┘
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │   Mistral AI Forensic Copilot   │
                                            │  (Modus Operandi, Threat Level, │
                                            │   CISO Briefing & SAR Advice)   │
                                            └────────────────┬────────────────┘
                                                             │
                                     ┌───────────────────────┴───────────────────────┐
                                     │                                               │
                                     ▼                                               ▼
                         ┌───────────────────────┐                       ┌───────────────────────┐
                         │      [ NORMAL ]       │                       │ [ SUSPICIOUS / FRAUD ]│
                         │    (Score 0 – 39)     │                       │    (Score 40 – 100)   │
                         └───────────┬───────────┘                       └───────────┬───────────┘
                                     │                                               │
                                     ▼                                               ▼
                         ┌───────────────────────┐                       ┌───────────────────────┐
                         │  `transactions` Table │                       │`suspicious_transactions`
                         │   (Neon PostgreSQL)   │                       │   (Neon PostgreSQL)   │
                         └───────────┬───────────┘                       └───────────┬───────────┘
                                     │                                               │
                                     └───────────────────────┬───────────────────────┘
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │  React + Vite Live Dashboard    │
                                            │ (Tailwind CSS + Bootstrap Icons)│
                                            │  • Real-Time Polling & Stream   │
                                            │  • 1-Click Forensic Inspector   │
                                            │  • CISO AI Threat Intelligence  │
                                            └─────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Role / Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | High-performance single page application |
| **Styling & UI** | Tailwind CSS + Bootstrap Icons (`bi-*`) | FinTech dark-mode theme, glassmorphism panels, badges |
| **Backend Framework**| Python 3.11+ / FastAPI | High-throughput asynchronous REST API & ingestion gateway |
| **Database** | Neon Cloud PostgreSQL 18.6 | Managed Serverless PostgreSQL with SSL pooling |
| **Data Streaming** | Aiven Kafka | Cloud Apache Kafka broker with REST Proxy & SASL_SSL |
| **AI Intelligence** | Mistral AI (`mistral-small-latest`) | Deep forensic transaction reasoning & CISO briefings |
| **ORM & DB Access** | SQLAlchemy 2.0 + Psycopg2 | Type-safe models, session management, and auto migrations |
| **Containerization** | Docker & Docker Compose | Multi-container local orchestration & Nginx production serving |
| **Cloud Hosting** | Render | Infrastructure-as-Code deployment via `render.yaml` |

---

## 4. Fraud Detection Scoring Engine & Rules

Each ingested transaction is evaluated against 4 primary threat dimensions. The engine aggregates point weights and caps the score at **100**:

$$\text{Risk Score} = \min(100, \sum \text{Rule Weights})$$

### 4.1 Rule Definitions & Point Weights

| Threat Vector | Rule Condition | Point Weight | Rule Message |
| :--- | :--- | :---: | :--- |
| **Critical High Amount** | Amount $\ge \$10,000$ | **+50** | `Critical High Amount: $X exceeds $10,000 threshold (+50)` |
| **Elevated High Amount** | Amount $\ge \$5,000$ | **+30** | `High Amount: $X exceeds $5,000 threshold (+30)` |
| **High-Risk Category Anomaly** | Amount $\ge \$2,500$ in Crypto/Gambling/Wire | **+25** | `Elevated Amount in High-Risk Category (+25)` |
| **High Velocity Spike** | $\ge 4$ transactions in 60s for same account | **+45** | `High Velocity Spike: N transactions in 60s (+45)` |
| **Velocity Anomaly** | 3 transactions in 60s for same account | **+30** | `Velocity Anomaly: 3 transactions in 60s (+30)` |
| **High-Risk Jurisdiction** | Originates in Cayman Islands, Panama, etc. | **+35** | `High-Risk Jurisdiction Detected (+35)` |
| **Impossible Travel** | Rapid location jump in $<120\text{s}$ | **+30** | `Impossible Travel: Rapid location change (+30)` |
| **Off-Hours Activity** | Transaction between 01:00 AM – 04:30 AM | **+15** | `Off-Hours Activity: Night window (+15)` |
| **Structuring / Round Anomaly**| Round structuring amount (e.g. $\$9,999, \$5,000$) | **+10** | `Structuring Pattern: Threshold-skirting amount (+10)` |

### 4.2 Security Classification & Database Routing

- **`NORMAL` (Risk Score 0 – 39)**:
  - Clean retail transactions that meet standard velocity and volume heuristics.
  - Stored in the **`transactions`** table.
- **`SUSPICIOUS` (Risk Score 40 – 69)**:
  - Elevated risk requiring secondary verification (e.g. 2FA or step-up authentication).
  - Stored in the **`suspicious_transactions`** table with `fraud_reasons` populated.
- **`FRAUD` (Risk Score 70 – 100)**:
  - Critical fraud alert requiring immediate transaction blocking and account hold.
  - Stored in the **`suspicious_transactions`** table with detailed violation audit trail.

---

## 5. Database Schema (Neon PostgreSQL)

### 5.1 `transactions` Table (Normal Transactions)
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    account_id VARCHAR(64) NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    merchant VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64),
    device_type VARCHAR(32),
    risk_score INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'NORMAL',
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 `suspicious_transactions` Table (Flagged Incidents)
```sql
CREATE TABLE suspicious_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    account_id VARCHAR(64) NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    merchant VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64),
    device_type VARCHAR(32),
    risk_score INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'SUSPICIOUS' or 'FRAUD'
    fraud_reasons TEXT NOT NULL,  -- Semicolon-separated rule triggers
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Complete API Reference

### 6.1 Transaction & Analytics Endpoints

| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | Fetches aggregate volume, fraud rate %, risk scores, and trend buckets | None |
| `GET` | `/api/transactions` | Fetches normal verified transaction feed | `?limit=25&offset=0` |
| `GET` | `/api/suspicious-transactions`| Fetches flagged suspicious and fraud incidents | `?limit=25&status=FRAUD` |
| `GET` | `/api/feed` | Fetches combined unified transaction stream | `?limit=30` |
| `POST` | `/api/simulate` | Injects synthetic attack scenarios into the engine | `{"scenario": "HIGH_AMOUNT", "count": 1}` |
| `POST` | `/api/clear` | Wipes database tables for fresh demo state | None |
| `GET` | `/health` | System health check (API, Kafka status, DB status) | None |

### 6.2 Mistral AI Intelligence Endpoints

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/analyze` | Generates structured forensic audit on a transaction | Transaction JSON object |
| `GET` | `/api/ai/briefing` | Generates Chief Risk Officer executive portfolio summary | None |

### 6.3 CSV & Ingestion Endpoints

| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload-csv` | Ingests and scores a `.csv` batch file | `multipart/form-data` (file) |
| `GET` | `/api/csv-template` | Downloads sample CSV formatted dataset | None |
| `POST` | `/api/connect-external-api` | Pulls transactions from external REST API endpoint | `{"url": "https://api.domain.com/feed"}` |
| `POST` | `/api/webhook/transaction` | Inbound webhook receiver for payment gateways | Transaction JSON object |

### 6.4 Mock Core Banking API Endpoints

| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/mock-bank/feed` | Simulates Core Banking ledger transaction feed | `?count=5&include_fraud_ratio=0.3` |
| `POST` | `/mock-bank/webhook/trigger` | Dispatches simulated payment gateway webhook event | Optional custom payload |
| `GET` | `/mock-bank/accounts` | Returns simulated customer accounts ledger | None |

---

## 7. Project File & Folder Directory

```
Dataengineering/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Environment variables & settings loader
│   │   ├── database.py            # SQLAlchemy engine, session maker, table auto-init
│   │   ├── models.py              # Transaction & SuspiciousTransaction models
│   │   ├── schemas.py             # Pydantic validation & response schemas
│   │   ├── fraud_detector.py      # 4-factor scoring & velocity cache engine
│   │   ├── generator.py           # Synthetic financial transaction & burst generator
│   │   ├── mistral_service.py     # Mistral AI forensic auditor & briefing generator
│   │   ├── kafka_producer.py      # Kafka producer with REST & SASL_SSL fallback
│   │   ├── kafka_consumer.py      # Kafka background consumer daemon
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── stats.py           # GET /api/stats endpoint
│   │   │   ├── transactions.py    # Transaction queries & simulation endpoints
│   │   │   ├── external_ingest.py # CSV parser, external API connect & webhook
│   │   │   └── mock_bank.py       # Mock Core Banking ledger & webhook simulator
│   │   └── main.py                # FastAPI app entry point, CORS & lifespan
│   ├── requirements.txt           # Python dependencies list
│   ├── Dockerfile                 # Backend container definition
│   └── .env.example               # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Status badge, polling selector, modal triggers
│   │   │   ├── StatCards.jsx      # 5 Metrics widgets with Bootstrap Icons
│   │   │   ├── AIBriefingCard.jsx # Mistral AI Copilot summary card
│   │   │   ├── SimulatorControls.jsx # Interactive attack injector console
│   │   │   ├── RiskChart.jsx      # Visual risk classification progress bars
│   │   │   ├── SuspiciousTable.jsx# Flagged incidents table with filters
│   │   │   ├── TransactionTable.jsx # Live normal stream table
│   │   │   ├── TransactionModal.jsx # Deep inspection modal with Mistral AI audit
│   │   │   ├── CsvUploadModal.jsx # Drag-and-drop CSV batch upload modal
│   │   │   └── ExternalApiConnector.jsx # External API & Mock Bank connector
│   │   ├── services/
│   │   │   └── api.js             # Axios client for all backend endpoints
│   │   ├── App.jsx                # Main coordinating dashboard component
│   │   ├── index.css              # Tailwind directives & glassmorphism styling
│   │   └── main.jsx               # React entry point
│   ├── index.html                 # HTML template with Google Inter font
│   ├── package.json               # Node.js dependencies & scripts
│   ├── tailwind.config.js         # Tailwind configuration & custom colors
│   ├── postcss.config.js          # PostCSS configuration
│   ├── vite.config.js             # Vite build configuration
│   ├── nginx.conf                 # Nginx SPA production routing config
│   └── Dockerfile                 # Multi-stage frontend container definition
├── test_connections.py            # Diagnostic tool for Neon, Kafka, and REST
├── docker-compose.yml             # Full-stack local orchestration
├── render.yaml                    # Infrastructure-as-Code for Render deployment
├── .env.example                   # Master environment template
└── README.md                      # Quick-start documentation
```

---

## 8. Environment Variables (`.env`)

```env
# 1. Neon Cloud PostgreSQL Connection URL
DATABASE_URL=postgresql://user:password@ep-sample-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

# 2. Aiven Kafka Broker / REST Proxy Configuration
KAFKA_BOOTSTRAP_SERVERS=your-kafka-broker.aivencloud.com:23485
KAFKA_TOPIC=fintech.transactions
KAFKA_CONSUMER_GROUP=fraud-detection-group
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_USERNAME=avnadmin
KAFKA_SASL_PASSWORD=your_aiven_password_here

# 3. Mistral AI API Key
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=mistral-small-latest

# 4. Application Settings
ENVIRONMENT=development
PORT=8000
VITE_API_URL=http://localhost:8000
```

---

## 9. How to Run Locally

### 9.1 Development Mode (Standard)

#### Terminal 1 — Start the FastAPI Backend:
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- API Endpoint: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

#### Terminal 2 — Start the React Dashboard:
```powershell
cd frontend
npm run dev
```
- Dashboard URL: `http://localhost:5173`

---

### 9.2 Docker Compose Mode

Run the entire stack in isolated Docker containers:
```powershell
docker compose up --build
```
- Frontend Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

### 9.3 Connection Diagnostic Tool

To verify cloud connectivity to Neon PostgreSQL and Aiven Kafka at any time:
```powershell
python test_connections.py
```

---

## 10. Production Deployment on Render

### Method 1: Automated Blueprint Deployment (Recommended)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New** $\rightarrow$ **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml` to provision:
   - **Backend Web Service**: Python FastAPI service with auto-scaling.
   - **Frontend Static Site**: React SPA served with rewrite rules for client routing.
4. Set the `DATABASE_URL`, `MISTRAL_API_KEY`, and `KAFKA_BOOTSTRAP_SERVERS` environment variables.

### Method 2: Manual Service Creation
- **Backend**: Python 3 Web Service $\rightarrow$ Build: `pip install -r requirements.txt` $\rightarrow$ Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend**: Static Site $\rightarrow$ Build: `npm install && npm run build` $\rightarrow$ Publish: `dist` $\rightarrow$ Add `VITE_API_URL` pointing to the deployed backend URL.

---

## 11. Security & Compliance Best Practices

1. **Zero Hardcoded Secrets**: All database connection strings, Kafka credentials, and Mistral AI keys are loaded dynamically from environment variables.
2. **Explainable AI Fraud Reasoning**: Rule point weights are combined with Mistral AI forensic narratives, enabling compliance teams to file FinCEN Suspicious Activity Reports (SAR) with concrete audit trails.
3. **Resilient Fallback**: In the event of temporary network partitions with external brokers, transactions continue to be scored and stored reliably in Neon PostgreSQL.
