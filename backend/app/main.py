from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
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
    """Create tables on startup if they don't exist."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("FiveMinds API started — tables ensured")
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

# CORS — must list exact origins when allow_credentials=True
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
