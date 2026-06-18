from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import inspect, text
import time
import logging

from app.api.v1 import pipeline, datasets, reports, charts, agents, auth
from app.core.utils.exceptions import FiveMindsException
from app.config import settings
from app.database import async_engine
from app.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        def sync_migrate(sync_conn):
            inspector = inspect(sync_conn)
            table_names = inspector.get_table_names()
            raw_migrations = [
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS missing_values_pct VARCHAR",
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS storage_url VARCHAR",
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS dataset_schema JSONB",
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS schema_info JSONB",
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS schema JSONB",
                "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS rich_profile JSONB", # 🧠 NEW
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS dataset_name VARCHAR",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS dataset_path VARCHAR",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS business_question TEXT",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS total_time_ms INTEGER",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS quality_score_avg FLOAT",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS created_by VARCHAR",
                "ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS run_metadata JSONB",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS run_id UUID",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS agent_name VARCHAR",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS quality_score FLOAT",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS output_data JSONB",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS error_message TEXT",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE",
                "ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS run_id UUID",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS content TEXT",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_url VARCHAR",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type VARCHAR",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE"
            ]
            for table in ["datasets", "pipeline_runs", "agent_executions", "reports"]:
                if table in table_names:
                    for sql in raw_migrations:
                        if f"ALTER TABLE {table}" in sql:
                            try: sync_conn.execute(text(sql))
                            except Exception as e: logger.warning(f"AUTO-MIGRATE WARNING: {sql} -> {e}")
        await conn.run_sync(sync_migrate)
    logger.info("FiveMinds API started — tables ensured and fully auto-migrated")
    yield
    await async_engine.dispose()

app = FastAPI(title="FiveMinds API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "error_code": "VALIDATION_ERROR"})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc), "error_code": "INTERNAL_ERROR"})

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(pipeline.router, prefix="/api/v1", tags=["pipeline"])
app.include_router(datasets.router, prefix="/api/v1", tags=["datasets"])
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
app.include_router(charts.router, prefix="/api/v1", tags=["charts"])
app.include_router(agents.router, prefix="/api/v1", tags=["agents"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
