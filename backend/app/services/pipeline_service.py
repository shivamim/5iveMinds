import asyncio
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, update
from fastapi import HTTPException
from datetime import datetime
import uuid
import time
import json

from app.models import (
    PipelineRun,
    AgentExecution,
    PipelineStatus,
    AgentStatus,
    Dataset,
    Chart,
    Report,
)
from app.schemas import PipelineRunCreate
from app.core.orchestrator import Orchestrator
from app.core.message_board import MessageBoard
from app.core.agents.data_engineer import DataEngineerAgent
from app.core.agents.statistician import StatisticianAgent
from app.core.agents.ml_engineer import MLEngineerAgent
from app.core.agents.strategist import StrategistAgent
from app.core.agents.designer import DesignerAgent
from app.services.websocket_manager import WebSocketManager
from app.services.dataset_service import DatasetService
from app.services.chart_service import ChartService

logger = logging.getLogger(__name__)

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
        """Create a new pipeline run linked to the dataset by UUID."""
        dataset_name = str(request.dataset_id)
        dataset_id = request.dataset_id

        try:
            result = await self.db.execute(
                select(Dataset).where(Dataset.id == request.dataset_id)
            )
            ds = result.scalar_one_or_none()
            if ds:
                dataset_name = ds.filename
                logger.info(
                    f"Pipeline run creating for dataset {ds.id} ({ds.filename}) "
                    f"with {ds.row_count} rows, {ds.column_count} columns"
                )
            else:
                logger.warning(
                    f"Dataset {request.dataset_id} not found when creating pipeline run"
                )
                raise HTTPException(404, f"Dataset {request.dataset_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to lookup dataset for pipeline run: {e}", exc_info=True)
            raise HTTPException(500, f"Failed to lookup dataset: {e}")

        run = PipelineRun(
            dataset_id=dataset_id,
            dataset_name=dataset_name,
            business_question=request.business_question,
            status=PipelineStatus.QUEUED,
            run_metadata={
                "hitl_agents": request.hitl_agents,
                "custom_config": request.custom_config,
            },
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)
        logger.info(f"Pipeline run {run.id} created for dataset {dataset_id}")
        return run

    async def execute_pipeline_with_session(
        self,
        run_id: uuid.UUID,
        ws_manager: WebSocketManager,
        session_maker: async_sessionmaker,
    ):
        """Create a fresh DB session for the background task and run the pipeline."""
        async with session_maker() as db:
            self.db = db
            await self.execute_pipeline(run_id, ws_manager)

    async def execute_pipeline(
        self, run_id: uuid.UUID, ws_manager: WebSocketManager
    ):
        """Execute the full agent pipeline with proper dataset loading and chart/report persistence."""
        start_time = time.time()
        board = MessageBoard()

        # Load dataset context onto message board
        try:
            result = await self.db.execute(
                select(PipelineRun).where(PipelineRun.id == run_id)
            )
            run = result.scalar_one_or_none()

            if not run:
                logger.error(f"Pipeline run {run_id} not found")
                raise HTTPException(404, f"Pipeline run {run_id} not found")

            if run.dataset_id:
                ds_result = await self.db.execute(
                    select(Dataset).where(Dataset.id == run.dataset_id)
                )
                ds = ds_result.scalar_one_or_none()

                if ds:
                    schema = ds.schema or {}
                    columns = list(schema.keys())

                    board.post(
                        "dataset",
                        {
                            "id": str(ds.id),
                            "filename": ds.filename,
                            "row_count": ds.row_count,
                            "column_count": ds.column_count,
                            "columns": columns,
                            "schema": schema,
                            "column_stats": ds.column_stats or {},
                            "sample_data": ds.sample_data or [],
                        },
                    )
                    logger.info(
                        f"Loaded dataset {ds.id} ({ds.filename}) onto board: "
                        f"{ds.row_count} rows, {len(columns)} columns"
                    )
                else:
                    logger.error(
                        f"Dataset {run.dataset_id} linked to run {run_id} not found in DB"
                    )
                    raise HTTPException(
                        404,
                        f"Dataset {run.dataset_id} not found",
                    )
            else:
                logger.error(f"Pipeline run {run_id} has no dataset_id linked")
                raise HTTPException(400, "No dataset linked to pipeline run")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Failed to load dataset for pipeline run {run_id}: {e}",
                exc_info=True,
            )
            raise HTTPException(500, f"Failed to load dataset: {e}")

        # Update run status to running
        await self.db.execute(
            update(PipelineRun)
            .where(PipelineRun.id == run_id)
            .values(status=PipelineStatus.RUNNING, started_at=datetime.utcnow())
        )
        await self.db.commit()
        logger.info(f"Pipeline run {run_id} started")

        quality_scores = []
        all_results = {}

        for agent_name, AgentClass in AGENT_PIPELINE:
            exec_start = time.time()

            execution = AgentExecution(
                pipeline_run_id=run_id,
                agent_name=agent_name,
                status=AgentStatus.RUNNING,
                started_at=datetime.utcnow(),
            )
            self.db.add(execution)
            await self.db.commit()
            await self.db.refresh(execution)

            await ws_manager.broadcast(
                run_id,
                {
                    "type": "agent_started",
                    "agent_name": agent_name,
                    "message": f"{agent_name} started",
                },
            )

            try:
                agent = AgentClass(board)
                # Progress updates
                for p in [0.25, 0.5, 0.75]:
                    await asyncio.sleep(0.3)
                    await ws_manager.broadcast(
                        run_id,
                        {
                            "type": "agent_progress",
                            "agent_name": agent_name,
                            "progress": p,
                            "message": f"{agent_name} {int(p * 100)}%",
                        },
                    )

                result_data = await agent.execute()
                all_results[agent_name] = result_data

                # Persist charts from designer to charts table
                if agent_name == "designer":
                    await self._persist_charts(run_id, result_data)

                # Persist report from designer to reports table
                if agent_name == "designer":
                    await self._persist_report(run_id, result_data, board)

                # Quality score based on actual work done
                quality_score = self._calculate_quality_score(agent_name, result_data)
                exec_time = int((time.time() - exec_start) * 1000)

                execution.status = AgentStatus.COMPLETED
                execution.quality_score = quality_score
                execution.execution_time_ms = exec_time
                execution.output_data = result_data
                execution.completed_at = datetime.utcnow()
                quality_scores.append(quality_score)

                await ws_manager.broadcast(
                    run_id,
                    {
                        "type": "agent_completed",
                        "agent_name": agent_name,
                        "quality_score": quality_score,
                        "message": f"{agent_name} completed — quality {quality_score}",
                    },
                )
                logger.info(
                    f"Agent {agent_name} completed for run {run_id} "
                    f"in {exec_time}ms with quality {quality_score}"
                )

            except Exception as e:
                logger.error(f"Agent {agent_name} failed for run {run_id}: {e}", exc_info=True)
                execution.status = AgentStatus.FAILED
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()

                await ws_manager.broadcast(
                    run_id,
                    {
                        "type": "agent_failed",
                        "agent_name": agent_name,
                        "message": f"{agent_name} failed: {str(e)}",
                    },
                )

            await self.db.commit()

        total_time = int((time.time() - start_time) * 1000)
        avg_quality = (
            sum(quality_scores) / len(quality_scores) if quality_scores else 0
        )

        await self.db.execute(
            update(PipelineRun)
            .where(PipelineRun.id == run_id)
            .values(
                status=PipelineStatus.COMPLETED,
                completed_at=datetime.utcnow(),
                total_time_ms=total_time,
                quality_score_avg=avg_quality,
            )
        )
        await self.db.commit()

        logger.info(
            f"Pipeline run {run_id} completed in {total_time}ms "
            f"with avg quality {avg_quality:.1f}"
        )

        await ws_manager.broadcast(
            run_id,
            {
                "type": "pipeline_completed",
                "quality_score_avg": avg_quality,
                "total_time_ms": total_time,
                "message": "Pipeline completed",
            },
        )

    async def _persist_charts(self, run_id: uuid.UUID, designer_result: dict):
        """Save designer chart specs to the charts table."""
        chart_specs = designer_result.get("chart_specs", [])
        if not chart_specs:
            logger.warning(f"No chart specs to persist for run {run_id}")
            return

        try:
            for spec in chart_specs:
                clean_spec = self._make_json_serializable(spec)
                clean_data = self._make_json_serializable(spec.get("data", {}))

                chart = Chart(
                    pipeline_run_id=run_id,
                    agent_name="designer",
                    chart_type=spec.get("type", "unknown"),
                    chart_data=clean_data,
                    plotly_spec=clean_spec,
                )
                self.db.add(chart)

            await self.db.commit()
            logger.info(f"Persisted {len(chart_specs)} charts for run {run_id}")
        except Exception as e:
            logger.error(f"Failed to persist charts for run {run_id}: {e}", exc_info=True)
            try:
                await self.db.rollback()
            except Exception:
                pass

    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert numpy types, sets, and other non-JSON-serializable objects to Python native types."""
        if obj is None:
            return None
        if isinstance(obj, (str, int, float, bool)):
            return obj
        if isinstance(obj, (list, tuple)):
            return [self._make_json_serializable(item) for item in obj]
        if isinstance(obj, dict):
            return {str(k): self._make_json_serializable(v) for k, v in obj.items()}
        try:
            import numpy as np
            if isinstance(obj, (np.integer, np.int64, np.int32)):
                return int(obj)
            if isinstance(obj, (np.floating, np.float64, np.float32)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if isinstance(obj, np.bool_):
                return bool(obj)
        except ImportError:
            pass
        try:
            return str(obj)
        except Exception:
            return None

    async def _persist_report(self, run_id: uuid.UUID, designer_result: dict, board: MessageBoard):
        """Save executive report to reports table."""
        try:
            strategy = board.get("strategy", {})
            stats = board.get("statistics", {})
            ml = board.get("ml_results", {})
            data_quality = board.get("data_quality", {})
            dataset = board.get("dataset", {})

            lines = [
                f"# FiveMinds Executive Report",
                f"**Dataset:** {dataset.get('filename', 'Unknown')}",
                f"**Records:** {dataset.get('row_count', 0)} | **Columns:** {dataset.get('column_count', 0)}",
                "",
                "## Executive Summary",
                strategy.get("executive_summary", "Analysis completed successfully."),
                "",
                "## Key Findings",
            ]
            for finding in strategy.get("key_findings", []):
                lines.append(f"- {finding}")

            lines.extend([
                "",
                "## Data Quality",
                f"- Score: {data_quality.get('quality_score', 'N/A')}/100",
                f"- Missing values: {data_quality.get('missing_values_pct', 0)}%",
                f"- Outliers detected: {data_quality.get('outliers_detected', 0)}",
                "",
                "## Statistical Analysis",
                f"- Correlations analyzed: {len(stats.get('correlations', []))}",
                f"- Significant correlations: {stats.get('significant_correlations', 0)}",
                "",
                "## ML Results",
                f"- Best model: {ml.get('best_model', 'N/A')}",
                f"- R2 score: {ml.get('best_r2', 'N/A')}",
                f"- Top feature: {max(ml.get('feature_importance', {}).items(), key=lambda x: x[1])[0] if ml.get('feature_importance') else 'N/A'}",
                "",
                "## Recommendations",
            ])
            for rec in strategy.get("recommendations", []):
                lines.append(f"- **{rec.get('recommendation', '')}** ({rec.get('priority', 'Medium')} priority) — {rec.get('timeline', 'TBD')}")

            content = "\n".join(lines)

            report = Report(
                pipeline_run_id=run_id,
                report_type="executive",
                content=content,
            )
            self.db.add(report)
            await self.db.commit()
            logger.info(f"Persisted executive report for run {run_id}")
        except Exception as e:
            logger.error(f"Failed to persist report for run {run_id}: {e}", exc_info=True)
            try:
                await self.db.rollback()
            except Exception:
                pass

    def _calculate_quality_score(self, agent_name: str, result_data: dict) -> float:
        """Calculate quality score based on actual analysis depth."""
        base_score = 75.0

        if agent_name == "data_engineer":
            columns_analyzed = result_data.get("columns_analyzed", 0)
            schema_inferred = result_data.get("schema_inferred", False)
            quality_checks = result_data.get("quality_checks", {})
            score = base_score
            if schema_inferred:
                score += 10
            score += min(columns_analyzed * 2, 10)
            if quality_checks:
                score += 5
            return round(min(score, 98), 1)

        elif agent_name == "statistician":
            correlations = result_data.get("correlations", [])
            insights = result_data.get("insights", [])
            score = base_score
            score += min(len(correlations) * 3, 15)
            score += min(len(insights) * 2, 10)
            return round(min(score, 98), 1)

        elif agent_name == "ml_engineer":
            models = result_data.get("models_evaluated", [])
            feature_importance = result_data.get("feature_importance", {})
            score = base_score
            score += min(len(models) * 3, 15)
            if feature_importance:
                score += 10
            return round(min(score, 98), 1)

        elif agent_name == "strategist":
            insights = result_data.get("business_insights", [])
            actions = result_data.get("recommended_actions", [])
            llm_powered = result_data.get("llm_powered", False)
            score = base_score
            score += min(len(insights) * 2, 10)
            score += min(len(actions) * 2, 10)
            if llm_powered:
                score += 5
            return round(min(score, 98), 1)

        elif agent_name == "designer":
            charts = result_data.get("chart_specs", [])
            score = base_score
            score += min(len(charts) * 3, 15)
            if result_data.get("report_generated"):
                score += 10
            return round(min(score, 98), 1)

        return round(base_score, 1)

    # ========================================================================
    # CRITICAL FIX: get_status and get_results now return PLAIN DICTS.
    # This bypasses Pydantic v2 serialization which was converting JSON
    # objects back into strings in some asyncpg + PostgreSQL configurations.
    # ========================================================================

    async def get_status(self, run_id: uuid.UUID):
        result = await self.db.execute(
            select(PipelineRun).where(PipelineRun.id == run_id)
        )
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

        execution_responses = []
        for e in executions:
            od = e.output_data
            # CRITICAL: asyncpg sometimes returns JSON as a string
            if isinstance(od, str):
                try:
                    od = json.loads(od)
                except Exception:
                    od = None

            execution_responses.append({
                "id": str(e.id),
                "agent_name": e.agent_name,
                "status": e.status.value if e.status else "pending",
                "quality_score": e.quality_score,
                "execution_time_ms": e.execution_time_ms,
                "output_data": od,
                "error_message": e.error_message,
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None,
            })

        run_dict = {
            "id": str(run.id),
            "status": run.status.value if run.status else "queued",
            "dataset_id": str(run.dataset_id) if run.dataset_id else None,
            "dataset_name": run.dataset_name,
            "business_question": run.business_question,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "total_time_ms": run.total_time_ms,
            "quality_score_avg": run.quality_score_avg,
            "run_metadata": run.run_metadata or {},
        }

        return {
            "run": run_dict,
            "executions": execution_responses,
            "progress_percent": progress,
        }

    async def get_results(self, run_id: uuid.UUID):
        result = await self.db.execute(
            select(PipelineRun).where(PipelineRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")

        exec_result = await self.db.execute(
            select(AgentExecution).where(AgentExecution.pipeline_run_id == run_id)
        )
        executions = exec_result.scalars().all()

        normalized_executions = {}
        for e in executions:
            od = e.output_data
            if isinstance(od, str):
                try:
                    od = json.loads(od)
                except Exception:
                    od = None
            normalized_executions[e.agent_name] = od

        try:
            chart_service = ChartService(self.db)
            charts_data = await chart_service.get_charts(run_id)
        except Exception as e:
            logger.warning(f"Chart query failed for run {run_id}: {e}")
            charts_data = []

        try:
            report_result = await self.db.execute(
                select(Report).where(Report.pipeline_run_id == run_id)
            )
            reports_db = report_result.scalars().all()
            reports_data = [
                {
                    "id": str(r.id),
                    "report_type": r.report_type.value if r.report_type else None,
                    "content": r.content,
                    "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                }
                for r in reports_db
            ]
        except Exception as e:
            logger.warning(f"Report query failed for run {run_id}: {e}")
            reports_data = []

        return {
            "run": {
                "id": str(run.id),
                "status": run.status.value if run.status else "queued",
                "dataset_id": str(run.dataset_id) if run.dataset_id else None,
                "dataset_name": run.dataset_name,
                "business_question": run.business_question,
                "quality_score_avg": run.quality_score_avg,
                "total_time_ms": run.total_time_ms,
            },
            "executions": normalized_executions,
            "charts": charts_data,
            "reports": reports_data,
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
                "completed": (
                    e.completed_at.isoformat() if e.completed_at else None
                ),
            }
            for e in executions
        ]

    async def get_history(self, limit: int, offset: int):
        result = await self.db.execute(
            select(PipelineRun)
            .order_by(PipelineRun.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_run(self, run_id: uuid.UUID):
        result = await self.db.execute(
            select(PipelineRun).where(PipelineRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")
        await self.db.delete(run)
        await self.db.commit()
