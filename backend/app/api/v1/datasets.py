from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_async_db
from app.schemas import DatasetUploadResponse, Dataset
from app.services.dataset_service import DatasetService
from app.config import settings

router = APIRouter()

@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db)
):
    """Upload a CSV/Excel dataset"""
    # ✅ Robust file validation
    if not file or not file.filename:
        raise HTTPException(422, "No file provided")
    
    # Read file contents once for validation
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(422, "Uploaded file is empty")
    
    # Check file size (default 50MB if not set)
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 50 * 1024 * 1024)
    if len(contents) > max_size:
        raise HTTPException(
            413, 
            f"File too large. Max {max_size // (1024*1024)}MB."
        )
    
    # ✅ Validate file extension
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            422, 
            "Unsupported file format. Use CSV or Excel (.csv, .xlsx, .xls)."
        )
    
    # ✅ CRITICAL: Rewind file pointer so DatasetService can re-read it
    await file.seek(0)
    
    service = DatasetService(db)
    try:
        return await service.process_upload(file)
    except ValueError as e:
        # Re-raise as 422 for validation errors
        raise HTTPException(422, str(e))
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(500, f"Upload processing failed: {str(e)}")

@router.get("/datasets", response_model=List[Dataset])
async def list_datasets(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    """List all uploaded datasets"""
    service = DatasetService(db)
    return await service.list_datasets(limit, offset)

@router.get("/datasets/{dataset_id}", response_model=Dataset)
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

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a dataset"""
    service = DatasetService(db)
    await service.delete_dataset(dataset_id)
    return {"status": "deleted"}
