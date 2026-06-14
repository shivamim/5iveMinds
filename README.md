# FiveMinds

**Five Agents. One Mind. Zero Manual Work.**

Upload a CSV. Ask a question. Get boardroom-ready insights in under 30 seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-blue?style=for-the-badge)](https://5ive-minds-two.vercel.app)
[![API Docs](https://img.shields.io/badge/API-Docs-purple?style=for-the-badge)](https://5iveminds-production.up.railway.app/docs)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## What is FiveMinds?

FiveMinds is a multi-agent AI platform that automates the entire data analysis pipeline from raw CSV to executive report, with no code and no manual work.

Five specialized AI agents collaborate in sequence:

| Agent | Role |
|-------|------|
| **Data Engineer** | Schema inference, cleaning, imputation, outlier detection |
| **Statistician** | EDA, hypothesis testing, correlation matrices |
| **ML Engineer** | AutoML across 5 models with SHAP explainability |
| **Strategist** | Business recommendations with ROI projections |
| **Designer** | Boardroom-ready PDF / Excel / PPT / HTML reports |

---

## Demo

Upload `churn_dataset.csv`, ask "Why are customers churning?", get a complete analysis in ~27 seconds.

- **Pipeline Dashboard** - live agent progress, quality scores, execution logs
- **Statistics** - distribution charts, correlation heatmaps, hypothesis tests
- **ML Results** - feature importance, 5-model comparison, SHAP summary
- **Strategic Insights** - ROI projections, prioritized recommendations
- **Executive Report** - one-click export in 4 formats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + Recharts |
| Backend | FastAPI (async) + SQLAlchemy 2.0 + asyncpg + Pydantic v2 |
| Database | Supabase PostgreSQL 15 |
| LLM | Groq API (Llama 3 8B / 70B) |
| Hosting | Vercel (frontend) + Railway (backend) + Supabase (database) |

---

## Architecture

```
FRONTEND (Vercel)
  React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
  Zustand | Recharts | Framer Motion | React Dropzone
        |
        |  HTTPS / WebSocket
        v
BACKEND (Railway)
  FastAPI + SQLAlchemy (async) + asyncpg + Pydantic v2
  BackgroundTasks | WebSocket Manager | Groq LLM API
        |
        |  asyncpg + connection pooler (port 5432)
        v
DATABASE (Supabase)
  PostgreSQL 15 | Session-mode connection pooler
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- [Groq API Key](https://console.groq.com)

### 1. Clone

```bash
git clone https://github.com/shivamim/FiveMinds.git
cd FiveMinds
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Open

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

---

## Environment Variables

### Backend (Railway)

```env
DATABASE_URL=postgresql://postgres.YOUR_REF:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://5ive-minds-two.vercel.app
CORS_ORIGINS_STR=https://5ive-minds-two.vercel.app,http://localhost:5173
SECRET_KEY=your-random-32-char-string
ENVIRONMENT=production
VERSION=2.0.0
```

> Use Supabase port **5432** (session mode), NOT 6543. Port 6543 breaks asyncpg prepared statements.

### Frontend (Vercel)

```env
VITE_API_URL=https://5iveminds-production.up.railway.app
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |
| `/api/v1/datasets/upload` | POST | Upload CSV / Excel |
| `/api/v1/datasets` | GET | List datasets |
| `/api/v1/pipeline/run` | POST | Trigger pipeline |
| `/api/v1/pipeline/{id}/status` | GET | Pipeline status |
| `/api/v1/pipeline/{id}/results` | GET | Full results |
| `/api/v1/pipeline/{id}/ws` | WS | Real-time updates |
| `/api/v1/reports/generate` | POST | Generate export |

---

## Key Engineering Notes

### asyncpg + PgBouncer (Supabase)

Supabase transaction-mode pooler (port 6543) does not support asyncpg prepared statements. Fix:

```python
create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {"jit": "off"}
    }
)
```

### Background Task Session Lifecycle

FastAPI closes the request-scoped DB session before background tasks finish. Fix by passing a `session_maker` factory:

```python
session_maker = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
background_tasks.add_task(service.execute_pipeline_with_session, run.id, ws_manager, session_maker)
```

---

## Roadmap

- [x] 5-agent pipeline with real LLM (Groq)
- [x] AutoML - 5-model comparison + SHAP
- [x] Real-time progress (WebSocket + polling)
- [x] Export: PDF, Excel, PPT, HTML
- [x] Dark / light mode + mobile-friendly UI
- [x] Pipeline history
- [ ] User authentication and multi-tenancy
- [ ] Dataset preview and column editor
- [ ] Custom agent configuration
- [ ] Scheduled recurring analysis
- [ ] Slack / Discord notifications

---

## Contributing

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Then open a Pull Request.

---

## License

MIT - see [LICENSE](LICENSE)

---

Built by [Shivam Shukla](https://github.com/shivamim)
