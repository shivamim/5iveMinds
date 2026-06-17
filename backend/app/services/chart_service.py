from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
import uuid

from app.models import Chart
from app.schemas import ChartResponse

class ChartService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_charts(self, run_id: uuid.UUID):
        """Get all charts for a pipeline run with full data."""
        result = await self.db.execute(
            select(Chart).where(Chart.pipeline_run_id == run_id)
        )
        charts = result.scalars().all()
        
        # FIXED: Return full chart data including plotly_spec
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

    async def get_chart_by_type(self, run_id: uuid.UUID, chart_type: str):
        """Get specific chart by type."""
        result = await self.db.execute(
            select(Chart).where(
                Chart.pipeline_run_id == run_id,
                Chart.chart_type == chart_type
            )
        )
        chart = result.scalar_one_or_none()
        if not chart:
            raise HTTPException(404, "Chart not found")
        
        return {
            "id": str(chart.id),
            "pipeline_run_id": str(chart.pipeline_run_id),
            "agent_name": chart.agent_name,
            "chart_type": chart.chart_type,
            "chart_data": chart.chart_data,
            "plotly_spec": chart.plotly_spec,
            "generated_at": chart.generated_at.isoformat() if chart.generated_at else None,
        }
