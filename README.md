# Real-Time FinTech Fraud Detection Engine

A full-stack, event-driven FinTech platform that ingests financial transactions in real-time through **Aiven Kafka**, evaluates transactions using a 4-rule **Fraud Detection Engine (Risk Score 0–100)**, conducts AI forensic auditing with **Mistral AI**, supports **CSV batch uploads** & **Mock Core Banking APIs**, persists records into **Neon PostgreSQL**, and visualizes alerts on a responsive **React + Tailwind + Bootstrap Icons** dashboard.

> 📖 **Full System Documentation**: See [DOCUMENTATION.md](file:///c:/Users/USER/OneDrive/Desktop/Dataengineering/DOCUMENTATION.md)  
> 🔄 **Complete Data Flow Guide**: See [FLOW_ARCHITECTURE.md](file:///c:/Users/USER/OneDrive/Desktop/Dataengineering/FLOW_ARCHITECTURE.md)

---

## Architecture & Data Flow

```
+---------------------------+
| Synthetic Txn Generator   |  (Normal, Velocity Bursts, $10k+ Anomalies, Offshore)
+-------------+-------------+
              |
              v
+-------------+-------------+
|     Aiven Kafka Broker    |  (Topic: fintech.transactions)
+-------------+-------------+
              |
              v
+-------------+-------------+
|    FastAPI Python Consumer|  (Rule-based evaluation: Risk Score 0–100)
+-------------+-------------+
              |
      +-------+-------+
      |               |
      v               v
 [ NORMAL ]    [ SUSPICIOUS / FRAUD ]
 (Score 0-39)    (Score 40-100)
      |               |
      v               v
+-------------+ +-------------+
| transactions| | suspicious_ |  (Neon Cloud PostgreSQL)
|    table    | |transactions |
+------+------+ +------+------+
       |               |
       +-------+-------+
               |
               v
+--------------+-------------+
|     React + Vite Dashboard |  (Live Polling Sync + BI Icons + Tailwind)
+----------------------------+
```

---

## Fraud Detection Rules & Scoring

Each transaction receives an explainable **Risk Score from 0 to 100**:

| Rule Category | Condition | Points Added |
| :--- | :--- | :---: |
| **High Amount** | Amount $\ge \$10,000$ <br> Amount $\ge \$5,000$ | **+50** <br> **+30** |
| **Velocity Spike** | $\ge 4$ transactions in 60s for same account <br> 3 transactions in 60s | **+45** <br> **+30** |
| **High-Risk Location** | Origin in high-risk jurisdiction (Cayman Islands, Panama, etc.) <br> Impossible rapid travel between locations | **+35** <br> **+30** |
| **Behavioral Anomalies**| Off-hours activity (01:00 – 04:30 AM) <br> Round number structuring (e.g. $\$9,999$) | **+15** <br> **+10** |

### Classification & Storage Table:
- **`NORMAL` (Score 0 – 39)** $\rightarrow$ Saved to `transactions` table.
- **`SUSPICIOUS` (Score 40 – 69)** $\rightarrow$ Saved to `suspicious_transactions` table with reasons.
- **`FRAUD` (Score 70 – 100)** $\rightarrow$ Saved to `suspicious_transactions` table with reasons.

---

## Project Structure

```
Dataengineering/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # Loads .env (Neon DB URL, Aiven Kafka URI/SSL)
│   │   ├── database.py           # SQLAlchemy engine & session management
│   │   ├── models.py             # Transaction & SuspiciousTransaction tables
│   │   ├── schemas.py            # Pydantic request & response schemas
│   │   ├── fraud_detector.py     # 4-factor scoring & rule engine
│   │   ├── kafka_producer.py     # Producer client with Aiven SSL/SASL
│   │   ├── kafka_consumer.py     # Background consumer & persistence worker
│   │   ├── generator.py          # Synthetic financial transaction generator
│   │   ├── routes/
│   │   │   ├── stats.py          # GET /api/stats (metrics & distribution)
│   │   │   └── transactions.py   # GET /api/transactions, POST /api/simulate
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Status pills, polling toggle, refresh button
│   │   │   ├── StatCards.jsx     # 5 Metric cards with Bootstrap Icons
│   │   │   ├── SimulatorControls.jsx # Interactive attack scenario trigger
│   │   │   ├── RiskChart.jsx     # Visual risk classification breakdown
│   │   │   ├── SuspiciousTable.jsx   # Flagged incidents table with filters
│   │   │   ├── TransactionTable.jsx  # Normal live stream table
│   │   │   └── TransactionModal.jsx  # Detailed transaction inspector
│   │   ├── services/
│   │   │   └── api.js            # Axios client for backend APIs
│   │   ├── App.jsx               # Main dashboard with real-time polling
│   │   ├── index.css             # Tailwind CSS & custom styling
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml            # Multi-container local execution
├── render.yaml                   # Infrastructure-as-code for Render deployment
├── .env.example                  # Template configuration
└── README.md
```

---

## Quick Start (Local Running)

### Option 1: Run with Python & Node (Recommended for Development)

#### 1. Setup Backend:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Neon DB and Aiven Kafka details (or leave empty to use local SQLite)
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

#### 2. Setup Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Option 2: Run with Docker Compose

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## Required `.env` Variables

Create a `.env` file in `backend/` or set environment variables:

```env
# 1. Neon PostgreSQL URL (from https://console.neon.tech)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require

# 2. Aiven Kafka Broker URI (from https://console.aiven.io)
KAFKA_BOOTSTRAP_SERVERS=kafka-service-org.aivencloud.com:12345
KAFKA_TOPIC=fintech.transactions
KAFKA_CONSUMER_GROUP=fraud-detection-group
KAFKA_SECURITY_PROTOCOL=SSL

# If using SSL Certs (Standard Aiven Kafka):
KAFKA_SSL_CAFILE=certs/ca.pem
KAFKA_SSL_CERTFILE=certs/service.cert
KAFKA_SSL_KEYFILE=certs/service.key

# If using SASL_SSL:
KAFKA_SASL_USERNAME=avnadmin
KAFKA_SASL_PASSWORD=your_aiven_password
```

> **Note:** If `DATABASE_URL` or `KAFKA_BOOTSTRAP_SERVERS` are omitted, the application runs in local standalone mode using SQLite and direct engine processing so you can test immediately.

---

## How to Deploy on Render

### Method A: Blueprint Deployment (Easiest)
1. Push your code to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New** $\rightarrow$ **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and configure both the Backend Web Service and Frontend Static Site.
4. Set the `DATABASE_URL` (Neon) and `KAFKA_BOOTSTRAP_SERVERS` (Aiven) under Environment Variables.

### Method B: Manual Service Creation
1. **Backend Web Service**:
   - **Environment**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Add Env Var**: `DATABASE_URL = <your-neon-url>`

2. **Frontend Static Site**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Add Env Var**: `VITE_API_URL = https://<your-backend-service-name>.onrender.com`
