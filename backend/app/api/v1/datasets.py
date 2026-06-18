from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel
from datetime import datetime
import logging

from app.database import get_async_db
from app.schemas import DatasetUploadResponse
from app.services.dataset_service import DatasetService

logger = logging.getLogger(__name__)
router = APIRouter()

# Safe fallback schema (Pydantic V2 compliant)
class DatasetResponse(BaseModel):
    id: str
    filename: str
    row_count: int | None = None
    column_count: int | None = None
    file_size_bytes: int | None = None
    uploaded_at: datetime | None = None

    class Config:
        from_attributes = True  # Pydantic V2 ORM mode

@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db)
):
    if not file or not file.filename:
        raise HTTPException(422, "No file provided")
    
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(422, "Uploaded file is empty")
    
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(413, "File too large. Max 50MB.")
    
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(422, "Unsupported file format. Use CSV or Excel.")
    
    await file.seek(0)
    
    service = DatasetService(db)
    try:
        return await service.process_upload(file)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(500, f"Upload processing failed: {str(e)}")

@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    service = DatasetService(db)
    return await service.list_datasets(limit, offset)

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    service = DatasetService(db)
    dataset = await service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    return dataset

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    service = DatasetService(db)
    await service.delete_dataset(dataset_id)
    return {"status": "deleted"}
