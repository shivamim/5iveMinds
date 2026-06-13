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
        result = await self.db.execute(
            select(Chart).where(Chart.pipeline_run_id == run_id)
        )
        return result.scalars().all()

    async def get_chart_by_type(self, run_id: uuid.UUID, chart_type: str):
        result = await self.db.execute(
            select(Chart).where(
                Chart.pipeline_run_id == run_id,
                Chart.chart_type == chart_type
            )
        )
        chart = result.scalar_one_or_none()
        if not chart:
            raise HTTPException(404, "Chart not found")
        return chart
