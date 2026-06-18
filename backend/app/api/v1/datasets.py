from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from pydantic import BaseModel
from datetime import datetime
import logging

from app.database import get_async_db
from app.schemas import DatasetUploadResponse
from app.services.dataset_service import DatasetService

logger = logging.getLogger(__name__)
router = APIRouter()

# ==========================================
# ✅ SAFE FALLBACK SCHEMA
# Defined locally so we NEVER crash if 'Dataset' is missing from app.schemas
# ==========================================
class DatasetResponse(BaseModel):
    id: str
    filename: str
    row_count: int | None = None
    column_count: int | None = None
    file_size_bytes: int | None = None
    uploaded_at: datetime | None = None

    class Config:
        from_attributes = True  # Pydantic V2 ORM mode
        orm_mode = True         # Pydantic V1 ORM mode

# ==========================================
# 1. UPLOAD DATASET
# ==========================================
@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db)
):
    """Upload a CSV/Excel dataset"""
    if not file or not file.filename:
        raise HTTPException(422, "No file provided")
    
    # Read file contents once for validation
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(422, "Uploaded file is empty")
    
    # 50MB limit
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(413, "File too large. Max 50MB.")
    
    # Validate file extension
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(422, "Unsupported file format. Use CSV or Excel (.csv, .xlsx, .xls).")
    
    # CRITICAL: Rewind file pointer so DatasetService can re-read it
    await file.seek(0)
    
    service = DatasetService(db)
    try:
        return await service.process_upload(file)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(500, f"Upload processing failed: {str(e)}")

# ==========================================
# 2. LIST DATASETS
# ==========================================
@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    """List all uploaded datasets"""
    service = DatasetService(db)
    return await service.list_datasets(limit, offset)

# ==========================================
# 3. GET SINGLE DATASET
# ==========================================
@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a specific dataset by ID"""
    service = DatasetService(db)
    dataset = await service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    return dataset

# ==========================================
# 4. DELETE DATASET
# ==========================================
@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a dataset"""
    service = DatasetService(db)
    await service.delete_dataset(dataset_id)
    return {"status": "deleted"}
