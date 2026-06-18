from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal, List
import uuid
from pydantic import BaseModel

from app.database import get_async_db
from app.schemas import ReportResponse, ExportRequest
from app.services.report_service import ReportService

router = APIRouter()

# ✅ Frontend-compatible Pydantic body model
class GenerateReportRequest(BaseModel):
    run_id: str
    format: str = "pdf"
    sections: List[str] = ["all"]

# ✅ IMPORTANT: Literal paths MUST come before parameterized paths in FastAPI
@router.post("/reports/generate")
async def generate_report(
    request: GenerateReportRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """Generate and export a report (frontend-friendly endpoint)"""
    try:
        run_id = uuid.UUID(request.run_id)
    except (ValueError, AttributeError):
        raise HTTPException(422, f"Invalid run_id: {request.run_id}")
    
    service = ReportService(db)
    file_url = await service.export_report(run_id, request.format, request.sections)
    return {
        "download_url": file_url, 
        "format": request.format, 
        "run_id": request.run_id
    }

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
