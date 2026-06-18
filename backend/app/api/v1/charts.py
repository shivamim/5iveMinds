from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.database import get_async_db
from app.schemas import ChartResponse, ChartCreate

router = APIRouter()

@router.post("/charts", response_model=ChartResponse)
async def create_chart(
    chart: ChartCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new chart (Stub for frontend compatibility)."""
    return ChartResponse(
        id=uuid.uuid4(),
        run_id=chart.run_id,
        chart_type=chart.chart_type,
        chart_data=chart.chart_data,
        title=chart.title
    )

@router.get("/charts/{run_id}", response_model=List[ChartResponse])
async def get_charts_for_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get all charts for a specific pipeline run."""
    return []
