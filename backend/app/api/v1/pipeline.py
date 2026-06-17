from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from typing import List
import json
import uuid

from app.database import get_async_db, async_engine
from app.models import PipelineRun, AgentExecution, PipelineStatus, AgentStatus
from app.schemas import PipelineRunCreate, PipelineRunResponse
from app.services.pipeline_service import PipelineService
from app.services.websocket_manager import WebSocketManager

router = APIRouter()
ws_manager = WebSocketManager()


@router.post("/pipeline/run", response_model=PipelineRunResponse)
async def start_pipeline(
    request: PipelineRunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db)
):
    """Start a new analytics pipeline"""
    service = PipelineService(db)
    run = await service.create_run(request)

    session_maker = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
    background_tasks.add_task(service.execute_pipeline_with_session, run.id, ws_manager, session_maker)

    return run


# CRITICAL FIX: Removed response_model so FastAPI doesn't re-serialize through Pydantic
@router.get("/pipeline/{run_id}/status")
async def get_pipeline_status(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    service = PipelineService(db)
    return await service.get_status(run_id)


@router.get("/pipeline/{run_id}/results")
async def get_pipeline_results(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    service = PipelineService(db)
    return await service.get_results(run_id)


@router.get("/pipeline/{run_id}/logs")
async def get_pipeline_logs(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    service = PipelineService(db)
    return await service.get_logs(run_id)


@router.get("/pipeline/history", response_model=List[PipelineRunResponse])
async def get_pipeline_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    service = PipelineService(db)
    return await service.get_history(limit, offset)


@router.delete("/pipeline/{run_id}")
async def delete_pipeline_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    service = PipelineService(db)
    await service.delete_run(run_id)
    return {"message": "Pipeline run deleted"}


@router.websocket("/pipeline/{run_id}/ws")
async def pipeline_websocket(websocket: WebSocket, run_id: uuid.UUID):
    await ws_manager.connect(websocket, run_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("action") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, run_id)
    except Exception:
        ws_manager.disconnect(websocket, run_id)
