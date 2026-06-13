# FiveMinds v2 — Deployment Guide

## Stack
- **Backend**: FastAPI on Railway
- **Frontend**: React/Vite on Vercel
- **Database**: Supabase (PostgreSQL)

---

## 1. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string (URI)**
3. Copy the **URI** (starts with `postgresql://postgres...`)
4. Tables are auto-created on first backend startup — no migration needed.

---

## 2. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select this repo → set **Root Directory** to `backend`
3. Add environment variables:

```
DATABASE_URL=<Supabase URI from step 1>
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
ENVIRONMENT=production
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS_STR=https://your-app.vercel.app,http://localhost:5173
```

4. Railway auto-detects the Dockerfile and deploys.
5. Note your Railway URL: `https://your-backend.up.railway.app`

---

## 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git repo**
2. Set **Root Directory** to `frontend`
3. Add environment variable:

```
VITE_API_URL=https://your-backend.up.railway.app
```

4. Deploy. Note your Vercel URL.

---

## 4. Update CORS

After you have both URLs:
- In Railway, update `FRONTEND_URL` and `CORS_ORIGINS_STR` to your real Vercel URL.
- Redeploy the backend (Railway does this automatically on env var change).

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # Fill in DATABASE_URL
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
cp .env.example .env   # Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Architecture

```
User → Vercel (React)
         ↓ REST / WebSocket
Railway (FastAPI)
         ↓ SQLAlchemy
Supabase (PostgreSQL)
```

5 agents run sequentially: Data Engineer → Statistician → ML Engineer → Strategist → Designer.
Real-time progress via WebSocket. Results stored in Supabase.
