from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
import uuid
import logging

from app.models import Chart, AgentExecution

logger = logging.getLogger(__name__)


class ChartService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_charts(self, run_id: uuid.UUID):
        """Get all charts for a pipeline run with full data.

        CRITICAL FIX: Falls back to reading chart specs from designer's
        output_data in agent_executions table if charts table is empty.
        This handles cases where _persist_charts failed or wasn't called.
        """
        result = await self.db.execute(
            select(Chart).where(Chart.pipeline_run_id == run_id)
        )
        charts = result.scalars().all()

        # If charts table has data, return it
        if charts:
            return [
                {
                    "id": str(c.id),
                    "pipeline_run_id": str(c.pipeline_run_id),
                    "agent_name": c.agent_name,
                    "chart_type": c.chart_type,
                    "chart_data": c.chart_data,
                    "plotly_spec": c.plotly_spec,
                    "generated_at": c.generated_at.isoformat() if c.generated_at else None,
                }
                for c in charts
            ]

        # CRITICAL FIX: Fallback - read chart specs from designer agent output_data
        logger.info(f"No charts found in charts table for run {run_id}, trying designer output_data fallback")
        return await self._get_charts_from_designer_output(run_id)

    async def _get_charts_from_designer_output(self, run_id: uuid.UUID):
        """Fallback: Extract chart specs from designer agent's output_data."""
        try:
            result = await self.db.execute(
                select(AgentExecution).where(
                    AgentExecution.pipeline_run_id == run_id,
                    AgentExecution.agent_name == "designer"
                )
            )
            designer_exec = result.scalar_one_or_none()

            if not designer_exec or not designer_exec.output_data:
                logger.warning(f"No designer execution found for run {run_id}")
                return []

            output_data = designer_exec.output_data
            # Handle case where output_data might be a JSON string
            if isinstance(output_data, str):
                import json
                try:
                    output_data = json.loads(output_data)
                except json.JSONDecodeError:
                    logger.error(f"Designer output_data is invalid JSON string for run {run_id}")
                    return []

            chart_specs = output_data.get("chart_specs", []) if isinstance(output_data, dict) else []
            if not chart_specs:
                logger.warning(f"No chart_specs in designer output for run {run_id}")
                return []

            logger.info(f"Found {len(chart_specs)} chart specs in designer output_data for run {run_id}")
            return [
                {
                    "id": f"fallback-{i}",
                    "pipeline_run_id": str(run_id),
                    "agent_name": "designer",
                    "chart_type": spec.get("type", "unknown"),
                    "chart_data": spec.get("data", {}),
                    "plotly_spec": spec,
                    "generated_at": designer_exec.completed_at.isoformat() if designer_exec.completed_at else None,
                }
                for i, spec in enumerate(chart_specs)
            ]
        except Exception as e:
            logger.error(f"Error getting charts from designer output for run {run_id}: {e}", exc_info=True)
            return []

    async def get_chart_by_type(self, run_id: uuid.UUID, chart_type: str):
        """Get specific chart by type."""
        all_charts = await self.get_charts(run_id)
        for chart in all_charts:
            if chart["chart_type"] == chart_type:
                return chart
        raise HTTPException(404, "Chart not found")
