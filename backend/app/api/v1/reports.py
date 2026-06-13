from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal
import uuid

from app.database import get_async_db
from app.schemas import ReportResponse, ExportRequest
from app.services.report_service import ReportService

router = APIRouter()

@router.get("/reports/{run_id}", response_model=ReportResponse)
async def get_report(
    run_id: uuid.UUID,
    report_type: Literal["executive", "technical", "summary"] = "executive",
    db: AsyncSession = Depends(get_async_db)
):
    """Get generated report for a pipeline run"""
    service = ReportService(db)
    return await service.get_report(run_id, report_type)

@router.post("/reports/{run_id}/export")
async def export_report(
    run_id: uuid.UUID,
    request: ExportRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """Export report to PDF/Excel/PPTX/HTML"""
    service = ReportService(db)
    file_url = await service.export_report(run_id, request.format, request.sections)
    return {"download_url": file_url, "format": request.format}
