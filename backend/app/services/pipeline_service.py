import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, update
from fastapi import HTTPException
from datetime import datetime
import uuid
import time

from app.models import PipelineRun, AgentExecution, PipelineStatus, AgentStatus, Dataset
from app.schemas import PipelineRunCreate, PipelineStatusResponse
from app.core.orchestrator import Orchestrator
from app.core.message_board import MessageBoard
from app.core.agents.data_engineer import DataEngineerAgent
from app.core.agents.statistician import StatisticianAgent
from app.core.agents.ml_engineer import MLEngineerAgent
from app.core.agents.strategist import StrategistAgent
from app.core.agents.designer import DesignerAgent
from app.services.websocket_manager import WebSocketManager

AGENT_PIPELINE = [
    ("data_engineer", DataEngineerAgent),
    ("statistician", StatisticianAgent),
    ("ml_engineer", MLEngineerAgent),
    ("strategist", StrategistAgent),
    ("designer", DesignerAgent),
]


class PipelineService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_run(self, request: PipelineRunCreate) -> PipelineRun:
        # Resolve dataset name
        dataset_name = str(request.dataset_id)
        try:
            result = await self.db.execute(
                select(Dataset).where(Dataset.id == request.dataset_id)
            )
            ds = result.scalar_one_or_none()
            if ds:
                dataset_name = ds.filename
        except Exception:
            pass

        run = PipelineRun(
            dataset_name=dataset_name,
            business_question=request.business_question,
            status=PipelineStatus.QUEUED,
            run_metadata={"hitl_agents": request.hitl_agents, "custom_config": request.custom_config}
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)
        return run

    async def execute_pipeline_with_session(self, run_id: uuid.UUID, ws_manager: WebSocketManager, session_maker: async_sessionmaker):
        """Create a fresh DB session for the background task and run the pipeline."""
        async with session_maker() as db:
            self.db = db
            await self.execute_pipeline(run_id, ws_manager)

    async def execute_pipeline(self, run_id: uuid.UUID, ws_manager: WebSocketManager):
        start_time = time.time()
        board = MessageBoard()

        # Load dataset context onto message board
        try:
            result = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
            run = result.scalar_one_or_none()
            if run:
                ds_result = await self.db.execute(
                    select(Dataset).where(Dataset.filename == run.dataset_name)
                )
                ds = ds_result.scalar_one_or_none()
                if ds:
                    board.post("dataset", {
                        "filename": ds.filename,
                        "row_count": ds.row_count,
                        "columns": list((ds.schema or {}).keys()),
                    })
        except Exception:
            pass

        await self.db.execute(
            update(PipelineRun).where(PipelineRun.id == run_id)
            .values(status=PipelineStatus.RUNNING, started_at=datetime.utcnow())
        )
        await self.db.commit()

        quality_scores = []

        for agent_name, AgentClass in AGENT_PIPELINE:
            exec_start = time.time()

            execution = AgentExecution(
                pipeline_run_id=run_id,
                agent_name=agent_name,
                status=AgentStatus.RUNNING,
                started_at=datetime.utcnow()
            )
            self.db.add(execution)
            await self.db.commit()
            await self.db.refresh(execution)

            await ws_manager.broadcast(run_id, {
                "type": "agent_started",
                "agent_name": agent_name,
                "message": f"{agent_name} started"
            })

            try:
                agent = AgentClass(board)
                for p in [0.25, 0.5, 0.75]:
                    await asyncio.sleep(0.3)
                    await ws_manager.broadcast(run_id, {
                        "type": "agent_progress",
                        "agent_name": agent_name,
                        "progress": p,
                        "message": f"{agent_name} {int(p*100)}%"
                    })

                result_data = await agent.execute()
                quality_score = result_data.get("quality_score", 85.0)
                exec_time = int((time.time() - exec_start) * 1000)

                execution.status = AgentStatus.COMPLETED
                execution.quality_score = quality_score
                execution.execution_time_ms = exec_time
                execution.output_data = result_data
                execution.completed_at = datetime.utcnow()
                quality_scores.append(quality_score)

                await ws_manager.broadcast(run_id, {
                    "type": "agent_completed",
                    "agent_name": agent_name,
                    "quality_score": quality_score,
                    "message": f"{agent_name} completed — quality {quality_score}"
                })

            except Exception as e:
                execution.status = AgentStatus.FAILED
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()

                await ws_manager.broadcast(run_id, {
                    "type": "agent_failed",
                    "agent_name": agent_name,
                    "message": f"{agent_name} failed: {str(e)}"
                })

            await self.db.commit()

        total_time = int((time.time() - start_time) * 1000)
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

        await self.db.execute(
            update(PipelineRun).where(PipelineRun.id == run_id)
            .values(
                status=PipelineStatus.COMPLETED,
                completed_at=datetime.utcnow(),
                total_time_ms=total_time,
                quality_score_avg=avg_quality
            )
        )
        await self.db.commit()

        await ws_manager.broadcast(run_id, {
            "type": "pipeline_completed",
            "quality_score_avg": avg_quality,
            "total_time_ms": total_time,
            "message": "Pipeline completed"
        })

    async def get_status(self, run_id: uuid.UUID) -> PipelineStatusResponse:
        result = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")

        exec_result = await self.db.execute(
            select(AgentExecution).where(AgentExecution.pipeline_run_id == run_id)
        )
        executions = exec_result.scalars().all()

        completed = sum(1 for e in executions if e.status == AgentStatus.COMPLETED)
        total = max(len(executions), 5)
        progress = (completed / total) * 100

        return PipelineStatusResponse(run=run, executions=list(executions), progress_percent=progress)

    async def get_results(self, run_id: uuid.UUID):
        result = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")

        exec_result = await self.db.execute(
            select(AgentExecution).where(AgentExecution.pipeline_run_id == run_id)
        )
        executions = exec_result.scalars().all()

        return {
            "run": {
                "id": str(run.id),
                "status": run.status.value,
                "dataset_name": run.dataset_name,
                "business_question": run.business_question,
                "quality_score_avg": run.quality_score_avg,
                "total_time_ms": run.total_time_ms,
            },
            "executions": {e.agent_name: e.output_data for e in executions},
            "charts": [],
            "reports": []
        }

    async def get_logs(self, run_id: uuid.UUID):
        exec_result = await self.db.execute(
            select(AgentExecution).where(AgentExecution.pipeline_run_id == run_id)
        )
        executions = exec_result.scalars().all()
        return [
            {
                "agent": e.agent_name,
                "status": e.status.value,
                "quality": e.quality_score,
                "error": e.error_message,
                "started": e.started_at.isoformat() if e.started_at else None,
                "completed": e.completed_at.isoformat() if e.completed_at else None,
            }
            for e in executions
        ]

    async def get_history(self, limit: int, offset: int):
        result = await self.db.execute(
            select(PipelineRun).order_by(PipelineRun.started_at.desc())
            .offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def delete_run(self, run_id: uuid.UUID):
        result = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")
        await self.db.delete(run)
        await self.db.commit()
