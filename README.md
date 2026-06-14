<div align="center">

```
  _____ _           __  __ _           _     
 |  ___(_)_   _____/  \/ /(_)_ __   __| |___ 
 | |_  | \ \ / / _ \ /\/\ /| | '_ \ / _` / __|
 |  _| | |\ V /  __/ |  | || | | | | (_| \__ \
 |_|   |_| \_/ \___|_|  |_||_|_| |_|\__,_|___/
```

# FIVEMINDS

### Five Agents. One Mind. Zero Manual Work.

> Upload a CSV. Ask a business question. Get boardroom-ready insights in under 30 seconds.

<br>

[![Live App](https://img.shields.io/badge/LIVE%20APP-VISIT%20NOW-0066FF?style=for-the-badge&logoColor=white)](https://5ive-minds-two.vercel.app)
[![API Docs](https://img.shields.io/badge/API-SWAGGER%20DOCS-7B2FBE?style=for-the-badge&logoColor=white)](https://5iveminds-production.up.railway.app/docs)
[![Backend](https://img.shields.io/badge/BACKEND-RAILWAY-000000?style=for-the-badge&logoColor=white)](https://5iveminds-production.up.railway.app/health)
[![License](https://img.shields.io/badge/LICENSE-MIT-22C55E?style=for-the-badge&logoColor=white)](LICENSE)
[![Made With](https://img.shields.io/badge/MADE%20WITH-GROQ%20%2B%20FASTAPI-FF6B35?style=for-the-badge&logoColor=white)](https://console.groq.com)

<br>

</div>

---

<div align="center">

## HOW IT WORKS

**1. Upload** your CSV or Excel file
&nbsp;&nbsp;&nbsp;**2. Ask** any business question
&nbsp;&nbsp;&nbsp;**3. Watch** 5 AI agents collaborate live
&nbsp;&nbsp;&nbsp;**4. Export** a boardroom-ready report

</div>

---

## THE 5 AGENTS

```
+------------------+-------------------------------------------------------+---------------------------+
|      AGENT       |                        ROLE                          |          OUTPUT           |
+------------------+-------------------------------------------------------+---------------------------+
|  Data Engineer   |  Schema inference, cleaning, imputation, outliers    |  Clean dataset + score    |
|  Statistician    |  EDA, distributions, hypothesis tests, correlations  |  Statistical summary      |
|  ML Engineer     |  AutoML x5 models, SHAP explainability               |  Best model + importance  |
|  Strategist      |  Business insights, ROI analysis, recommendations    |  Action plan + ROI        |
|  Designer        |  Report compilation and export generation            |  PDF / Excel / PPT / HTML |
+------------------+-------------------------------------------------------+---------------------------+
```

**Pipeline completes in under 30 seconds. Quality scored out of 100.**

---

## SCREENSHOTS

| Pipeline Dashboard | Statistical Analysis |
|--------------------|---------------------|
| Live agent progress, quality scores, 5/5 agents tracked in real time | Distribution charts, correlation heatmap, hypothesis test results |

| ML Results | Strategic Insights |
|------------|-------------------|
| Feature importance, 5-model AutoML comparison, SHAP summary | $1.35M ROI projection, churn reduction targets, prioritized recommendations |

---

## TECH STACK

```
FRONTEND                          BACKEND                           INFRA
---------                         --------                          -----
React 18 + Vite                   FastAPI (async)                   Vercel  (frontend)
TypeScript                        SQLAlchemy 2.0                    Railway (backend)
Tailwind CSS                      asyncpg                           Supabase (database)
shadcn/ui + Radix UI              Pydantic v2                       Groq API (LLM)
Zustand (state)                   WebSocket Manager
Recharts (charts)                 BackgroundTasks
Framer Motion                     PostgreSQL 15
React Dropzone                    Llama 3 8B / 70B
```

---

## ARCHITECTURE

```
+-----------------------------------------------+
|              FRONTEND  (Vercel)               |
|  React 18 + Vite + TypeScript + Tailwind CSS  |
|  Zustand | Recharts | Framer Motion           |
+------------------------+----------------------+
                         |
               HTTPS / WebSocket
                         |
                         v
+-----------------------------------------------+
|              BACKEND  (Railway)               |
|  FastAPI + SQLAlchemy + asyncpg + Pydantic    |
|  BackgroundTasks | WebSocket | Groq LLM API  |
+------------------------+----------------------+
                         |
           asyncpg + connection pooler
                  (port 5432)
                         |
                         v
+-----------------------------------------------+
|            DATABASE  (Supabase)               |
|     PostgreSQL 15 | Session-mode pooler       |
+-----------------------------------------------+
```

---

## QUICK START

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- [Groq API Key](https://console.groq.com)

---

### Step 1 -- Clone

```bash
git clone https://github.com/shivamim/FiveMinds.git
cd FiveMinds
```

### Step 2 -- Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in DATABASE_URL, GROQ_API_KEY, SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### Step 3 -- Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

### Step 4 -- Open

```
Frontend   ->  http://localhost:5173
API Docs   ->  http://localhost:8000/docs
Health     ->  http://localhost:8000/health
```

---

## ENVIRONMENT VARIABLES

### Backend (Railway)

```env
DATABASE_URL        = postgresql://postgres.YOUR_REF:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY        = gsk_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL        = https://example.app
CORS_ORIGINS_STR    = https://example.app,http://localhost:
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

## API REFERENCE

```
METHOD   ENDPOINT                          DESCRIPTION
------   --------                          -----------
GET      /health                           Health check
GET      /docs                             Swagger UI
POST     /api/v1/datasets/upload           Upload CSV or Excel
GET      /api/v1/datasets                  List all datasets
POST     /api/v1/pipeline/run              Trigger analysis pipeline
GET      /api/v1/pipeline/{id}/status      Agent progress + status
GET      /api/v1/pipeline/{id}/results     Full results payload
GET      /api/v1/pipeline/{id}/logs        Agent execution logs
WS       /api/v1/pipeline/{id}/ws          Real-time WebSocket updates
POST     /api/v1/reports/generate          Generate export report
```

---

## KEY ENGINEERING DECISIONS

### Fix 1 -- asyncpg + PgBouncer (Supabase)

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

### Fix 2 -- Background Task Session Lifecycle

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

## ROADMAP

```
DONE                                    COMING SOON
----                                    -----------
[x] 5-agent AI pipeline (Groq LLM)     [ ] User authentication + multi-tenancy
[x] AutoML - 5 models + SHAP           [ ] Dataset preview and column editor
[x] Real-time WebSocket progress        [ ] Custom agent configuration
[x] Export: PDF, Excel, PPT, HTML       [ ] Scheduled recurring analysis
[x] Dark / light mode UI               [ ] Slack / Discord notifications
[x] Full pipeline history              [ ] API key management for teams
[x] Quality scoring engine
[x] Mobile-friendly responsive UI
```

---

## CONTRIBUTING

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m "feat: add amazing feature"

# 4. Push and open a Pull Request
git push origin feature/amazing-feature
```

All contributions are welcome. Please follow conventional commits.

---

## LICENSE

Distributed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

<div align="center">

```
+------------------------------------------------+
|                                                |
|   Built by someone who builds things that      |
|   break, and breaks things that build.         |
|                                                |
|          Shivam Shukla                         |
|          github.com/shivamim                   |
|                                                |
+------------------------------------------------+
```

</div>
