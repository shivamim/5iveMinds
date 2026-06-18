from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from typing import List, Dict
import uuid
import logging
import json

from app.database import get_async_db, async_engine
from app.schemas import PipelineRunCreate, PipelineRunResponse
from app.services.pipeline_service import PipelineService

logger = logging.getLogger(__name__)

router = APIRouter()

# ==========================================
# ✅ WEBSOCKET MANAGER (Built-in to prevent ModuleNotFoundError)
# ==========================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, run_id: str):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)
        logger.info(f"WebSocket connected for run {run_id}")

    def disconnect(self, websocket: WebSocket, run_id: str):
        if run_id in self.active_connections:
            if websocket in self.active_connections[run_id]:
                self.active_connections[run_id].remove(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]
        logger.info(f"WebSocket disconnected for run {run_id}")

    async def broadcast(self, run_id: str, message: dict):
        if run_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[run_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Dead WebSocket connection: {e}")
                    dead_connections.append(connection)
            for conn in dead_connections:
                self.disconnect(conn, run_id)

    # Alias for services that might call send_personal_message
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            pass

ws_manager = ConnectionManager()

# ==========================================
# ✅ CRITICAL FIX: Session factory for background tasks.
# FastAPI closes the HTTP session instantly. This factory lets 
# background agents spawn their own safe, independent DB sessions.
# ==========================================
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
        run = await service.create_run(request)
        
        # Pass the session_maker so background tasks don't crash
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
# 2. LIST RUNS (Frontend History Alias)
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
# 3. PARAMETERIZED ROUTES
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
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, str(run_id))
    except Exception as e:
        logger.error(f"WebSocket error for run {run_id}: {e}")
        ws_manager.disconnect(websocket, str(run_id))
