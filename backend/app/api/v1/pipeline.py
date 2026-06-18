from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from typing import List
import uuid
import logging

from app.database import get_async_db, async_engine
from app.schemas import PipelineRunCreate, PipelineRunResponse
from app.services.pipeline_service import PipelineService

# Adjust this import to match where your WebSocket ConnectionManager is defined
try:
    from app.core.websocket import ConnectionManager, ws_manager
except ImportError:
    # Fallback if your repo structure defines it differently
    from app.websocket import ConnectionManager, ws_manager 

logger = logging.getLogger(__name__)

router = APIRouter()

# ✅ CRITICAL FIX: Session factory for background tasks.
# FastAPI closes the request-scoped DB session the millisecond the HTTP response is sent.
# If we pass the live `db` session to a background task, it will crash with "Session closed".
# We pass this factory so the background task can spawn its own independent, safe sessions.
session_maker = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# ==========================================
# 1. TRIGGER PIPELINE
# ==========================================
@router.post("/pipeline/run", response_model=PipelineRunResponse)
async def trigger_pipeline(
    request: PipelineRunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db)
):
    """Trigger a new multi-agent analysis pipeline."""
    service = PipelineService(db)
    
    try:
        # 1. Create the initial run record in the database
        run = await service.create_run(request)
        
        # 2. Add the heavy lifting to background tasks using the session_maker
        background_tasks.add_task(
            service.execute_pipeline_with_session, 
            run.id, 
            ws_manager, 
            session_maker
        )
        
        return run
    except Exception as e:
        logger.error(f"Failed to trigger pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start pipeline: {str(e)}")

# ==========================================
# 2. LIST RUNS (NEW ROUTE + HISTORY)
# ⚠️ MUST BE PLACED BEFORE PARAMETERIZED ROUTES
# ==========================================
@router.get("/pipeline", response_model=List[PipelineRunResponse])
async def list_pipeline_runs(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    """List pipeline runs (frontend alias for history)."""
    service = PipelineService(db)
    return await service.get_history(limit, offset)

@router.get("/pipeline/history", response_model=List[PipelineRunResponse])
async def get_pipeline_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    """Get pipeline execution history."""
    service = PipelineService(db)
    return await service.get_history(limit, offset)

# ==========================================
# 3. PARAMETERIZED ROUTES (STATUS, RESULTS, LOGS)
# ==========================================
@router.get("/pipeline/{run_id}/status")
async def get_pipeline_status(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get real-time status and agent progress for a specific run."""
    service = PipelineService(db)
    status = await service.get_status(run_id)
    if not status:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return status

@router.get("/pipeline/{run_id}/results")
async def get_pipeline_results(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get the final compiled results, charts, and agent outputs."""
    service = PipelineService(db)
    results = await service.get_results(run_id)
    if not results:
        raise HTTPException(status_code=404, detail="Pipeline run not found or still processing")
    return results

@router.get("/pipeline/{run_id}/logs")
async def get_pipeline_logs(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get detailed execution logs for debugging."""
    service = PipelineService(db)
    logs = await service.get_logs(run_id)
    if logs is None:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return logs

# ==========================================
# 4. WEBSOCKET FOR REAL-TIME UPDATES
# ==========================================
@router.websocket("/pipeline/{run_id}/ws")
async def pipeline_websocket(
    websocket: WebSocket, 
    run_id: uuid.UUID
):
    """WebSocket endpoint for live agent progress streaming."""
    await ws_manager.connect(websocket, str(run_id))
    try:
        while True:
            # Keep connection alive and listen for any client pings/messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, str(run_id))
    except Exception as e:
        logger.error(f"WebSocket error for run {run_id}: {e}")
        ws_manager.disconnect(websocket, str(run_id))
