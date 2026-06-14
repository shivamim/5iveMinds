<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:a855f7&height=200&section=header&text=FiveMinds&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Five%20Agents.%20One%20Mind.%20Zero%20Manual%20Work.&descAlignY=58&descSize=18" width="100%"/>

<br/>

[![Live App](https://img.shields.io/badge/%F0%9F%9A%80%20LIVE%20APP-Visit%20Now-6366f1?style=for-the-badge)](https://5ive-minds-two.vercel.app)
[![API Docs](https://img.shields.io/badge/%F0%9F%93%96%20API-Swagger%20Docs-a855f7?style=for-the-badge)](#api-reference)
[![License](https://img.shields.io/badge/%F0%9F%93%9C%20License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/%F0%9F%A4%96%20Built%20With-Groq%20%2B%20FastAPI-f97316?style=for-the-badge)](https://console.groq.com)
[![Stack](https://img.shields.io/badge/%F0%9F%94%A5%20Stack-React%20%2B%20Python-3b82f6?style=for-the-badge)](#tech-stack)

<br/>

> **Upload a CSV. Ask a business question. Get boardroom-ready insights in under 30 seconds.**

<br/>

</div>

---

## 🧠 What is FiveMinds?

FiveMinds is a **production-grade multi-agent AI platform** that automates the entire data analysis pipeline — from raw CSV to executive report — with no code, no manual work, and no waiting.

Five specialized AI agents collaborate in real time, each handling a distinct layer of the analysis:

<br/>

## 🤖 The 5 Agents

| # | Agent | Role | Output |
|---|-------|------|--------|
| 1 | 🔧 **Data Engineer** | Schema inference, cleaning, imputation, outlier detection | Clean dataset + quality score |
| 2 | 📊 **Statistician** | EDA, distributions, hypothesis testing, correlations | Statistical summary + significance tests |
| 3 | 🤖 **ML Engineer** | AutoML across 5 models, SHAP explainability | Best model + feature importance |
| 4 | 🧠 **Strategist** | Business insights, ROI analysis, recommendations | Action plan + ROI projections |
| 5 | 🎨 **Designer** | Report compilation and export generation | PDF / Excel / PPT / HTML |

> ⚡ **Pipeline completes in under 30 seconds. Quality scored out of 100.**

---

## ✨ How It Works

```
  [ 1. Upload ]  -->  [ 2. Ask ]  -->  [ 3. Watch ]  -->  [ 4. Export ]
  Drop your CSV       Ask anything      5 agents live      Boardroom-ready
  or Excel file       in plain English  in real time       in 4 formats
```

---

## 🖥️ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🔴 **Pipeline Dashboard** | Live agent progress, quality scores, execution logs in real time |
| 📈 **Statistical Analysis** | Distribution charts, correlation heatmaps, hypothesis test results |
| 🤖 **ML Results** | Feature importance, 5-model AutoML comparison, SHAP summary |
| 💡 **Strategic Insights** | ROI projections, churn targets, prioritized recommendations |
| 📄 **Executive Report** | One-click export in PDF, Excel, PPT, or HTML |
| 🌗 **Dark / Light Mode** | Fully responsive, mobile-friendly UI |
| 🔁 **Pipeline History** | View and revisit all past analyses |
| ⚡ **Real-Time Updates** | WebSocket + polling for live agent progress |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| 🎨 **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts, Framer Motion |
| ⚙️ **Backend** | FastAPI (async), SQLAlchemy 2.0, asyncpg, Pydantic v2, WebSockets |
| 🗄️ **Database** | Supabase PostgreSQL 15 |
| 🤖 **LLM** | Groq API — Llama 3 8B / 70B |
| ☁️ **Hosting** | Vercel (frontend) + Railway (backend) + Supabase (database) |

</div>

---

## 🏗️ Architecture

```
+--------------------------------------------------+
|             FRONTEND  (Vercel)                   |
|  React 18 + Vite + TypeScript + Tailwind CSS     |
|  Zustand  |  Recharts  |  Framer Motion          |
+-------------------------+------------------------+
                          |
                HTTPS / WebSocket
                          |
                          v
+--------------------------------------------------+
|             BACKEND  (Railway)                   |
|  FastAPI + SQLAlchemy + asyncpg + Pydantic v2    |
|  BackgroundTasks  |  WebSocket  |  Groq LLM API  |
+-------------------------+------------------------+
                          |
            asyncpg + connection pooler
                   (port 5432)
                          |
                          v
+--------------------------------------------------+
|            DATABASE  (Supabase)                  |
|      PostgreSQL 15  |  Session-mode pooler       |
+--------------------------------------------------+
```

---

## 🚀 Quick Start

### Prerequisites

- 🟢 Node.js 18+
- 🐍 Python 3.11+
- 🐘 PostgreSQL 14+
- 🔑 [Groq API Key](https://console.groq.com)

---

### Step 1 — Clone

```bash
git clone https://github.com/shivamim/FiveMinds.git
cd FiveMinds
```

### Step 2 — Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in DATABASE_URL, GROQ_API_KEY, SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### Step 3 — Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

### Step 4 — Open

```
🌐  Frontend   ->  http://localhost:5173
📖  API Docs   ->  http://localhost:8000/docs
❤️  Health     ->  http://localhost:8000/health
```

---

## 🔐 Environment Variables

### Backend (Railway)

```env
DATABASE_URL        = postgresql://postgres.YOUR_REF:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY        = gsk_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL        = https://your-frontend.vercel.app
CORS_ORIGINS_STR    = https://your-frontend.vercel.app,http://localhost:5173
SECRET_KEY          = your-random-32-char-string
ENVIRONMENT         = production
VERSION             = 2.0.0
```

> [!WARNING]
> Use Supabase port **5432** (session mode), NOT **6543** (transaction mode).
> Port 6543 breaks asyncpg prepared statements.

### Frontend (Vercel)

```env
VITE_API_URL = https://your-backend.up.railway.app
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/api/v1/datasets/upload` | Upload CSV or Excel |
| `GET` | `/api/v1/datasets` | List all datasets |
| `POST` | `/api/v1/pipeline/run` | Trigger analysis pipeline |
| `GET` | `/api/v1/pipeline/{id}/status` | Agent progress + status |
| `GET` | `/api/v1/pipeline/{id}/results` | Full results payload |
| `GET` | `/api/v1/pipeline/{id}/logs` | Agent execution logs |
| `WS` | `/api/v1/pipeline/{id}/ws` | Real-time WebSocket updates |
| `POST` | `/api/v1/reports/generate` | Generate export report |

---

## 🔧 Key Engineering Decisions

### Fix 1 — asyncpg + PgBouncer (Supabase)

Supabase transaction-mode pooler (port 6543) does not support asyncpg prepared statements.

```python
# backend/app/db/database.py
create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {"jit": "off"}
    }
)
```

### Fix 2 — Background Task Session Lifecycle

FastAPI closes the request-scoped DB session before background tasks finish.
Pass a `session_maker` factory instead of the live session.

```python
# backend/app/api/v1/pipeline.py
session_maker = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)
background_tasks.add_task(
    service.execute_pipeline_with_session, run.id, ws_manager, session_maker
)
```

---

## 🗺️ Roadmap

| Status | Feature |
|--------|---------|
| ✅ | 5-agent AI pipeline with real LLM (Groq) |
| ✅ | AutoML — 5-model comparison + SHAP explainability |
| ✅ | Real-time WebSocket progress tracking |
| ✅ | Export: PDF, Excel, PPT, HTML |
| ✅ | Dark / light mode, mobile-friendly UI |
| ✅ | Full pipeline history + quality scoring |
| 🔜 | User authentication and multi-tenancy |
| 🔜 | Dataset preview and column editor |
| 🔜 | Custom agent configuration |
| 🔜 | Scheduled recurring analysis |
| 🔜 | Slack / Discord notifications |
| 🔜 | API key management for teams |

---

## 🤝 Contributing

```bash
# 1. Fork the repo and create your branch
git checkout -b feature/amazing-feature

# 2. Commit with conventional commits
git commit -m "feat: add amazing feature"

# 3. Push and open a Pull Request
git push origin feature/amazing-feature
```

All contributions are welcome. Please follow conventional commits.

---

## 📜 License

Distributed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a855f7,100:6366f1&height=120&section=footer" width="100%"/>

*Built by someone who builds things that break,*
*and breaks things that build.*

**[Shivam Shukla](https://github.com/shivamim)**

</div>
