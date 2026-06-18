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
    """Create tables on startup if they don't exist, and AUTO-MIGRATE missing columns."""
    async with async_engine.begin() as conn:
        # 1. Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
        
        # 2. 🛡️ AUTO-MIGRATION: Add missing columns to existing tables dynamically
        def sync_migrate(sync_conn):
            inspector = inspect(sync_conn)
            table_names = inspector.get_table_names()
            
            # Define all columns that might be missing from older DB schemas
            migrations = {
                "datasets": [
                    ("missing_values_pct", "VARCHAR"),
                    ("storage_url", "VARCHAR"),
                    ("dataset_schema", "JSONB"),
                    ("schema_info", "JSONB"),
                    ("schema", "JSONB")
                ],
                "pipeline_runs": [
                    ("dataset_name", "VARCHAR"),
                    ("dataset_path", "VARCHAR"),
                    ("business_question", "TEXT"),
                    ("total_time_ms", "INTEGER"),
                    ("quality_score_avg", "FLOAT"),
                    ("created_by", "VARCHAR"),
                    ("run_metadata", "JSONB")
                ],
                "agent_executions": [
                    ("quality_score", "FLOAT"),
                    ("execution_time_ms", "INTEGER"),
                    ("output_data", "JSONB"),
                    ("error_message", "TEXT")
                ],
                "reports": [
                    ("content", "TEXT"),
                    ("file_url", "VARCHAR"),
                    ("report_type", "VARCHAR")
                ]
            }
            
            for table_name, cols in migrations.items():
                if table_name in table_names:
                    existing_cols = [c['name'] for c in inspector.get_columns(table_name)]
                    for col_name, col_type in cols:
                        if col_name not in existing_cols:
                            sql = f'ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}'
                            logger.info(f"AUTO-MIGRATE: {sql}")
                            sync_conn.execute(text(sql))
                            
        await conn.run_sync(sync_migrate)
        
    logger.info("FiveMinds API started — tables ensured and auto-migrated")
    yield
    await async_engine.dispose()
    logger.info("FiveMinds API shutdown — engine disposed")

app = FastAPI(
    title="FiveMinds API",
    description="Autonomous Multi-Agent Intelligence for End-to-End Analytics",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.exception_handler(FiveMindsException)
async def fiveminds_exception_handler(request: Request, exc: FiveMindsException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": exc.error_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "error_code": "VALIDATION_ERROR"},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "error_code": "INTERNAL_ERROR"},
    )

# Routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(pipeline.router, prefix="/api/v1", tags=["pipeline"])
app.include_router(datasets.router, prefix="/api/v1", tags=["datasets"])
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
app.include_router(charts.router, prefix="/api/v1", tags=["charts"])
app.include_router(agents.router, prefix="/api/v1", tags=["agents"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0", "environment": settings.ENVIRONMENT}

@app.get("/")
async def root():
    return {"message": "FiveMinds API v2.0", "docs": "/docs", "health": "/health"}
