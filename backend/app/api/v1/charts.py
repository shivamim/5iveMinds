from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.database import get_async_db
from app.schemas import ChartResponse
from app.services.chart_service import ChartService

router = APIRouter()

@router.get("/charts/{run_id}", response_model=List[ChartResponse])
async def get_all_charts(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get all charts for a pipeline run"""
    service = ChartService(db)
    return await service.get_charts(run_id)

@router.get("/charts/{run_id}/{chart_type}")
async def get_specific_chart(
    run_id: uuid.UUID,
    chart_type: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific chart by type"""
    service = ChartService(db)
    return await service.get_chart_by_type(run_id, chart_type)
