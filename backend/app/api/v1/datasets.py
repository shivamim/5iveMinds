from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import pandas as pd
import io
import uuid

from app.database import get_async_db
from app.schemas import DatasetUploadResponse, DatasetPreview
from app.services.dataset_service import DatasetService
from app.config import settings

router = APIRouter()

@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db)
):
    """Upload a CSV/Excel dataset"""
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(413, "File too large. Max 50MB.")

    service = DatasetService(db)
    return await service.process_upload(file)

@router.get("/datasets")
async def list_datasets(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_db)
):
    """List uploaded datasets"""
    service = DatasetService(db)
    return await service.list_datasets(limit, offset)

@router.get("/datasets/{dataset_id}/preview", response_model=DatasetPreview)
async def preview_dataset(
    dataset_id: uuid.UUID,
    row_limit: int = 100,
    db: AsyncSession = Depends(get_async_db)
):
    """Preview dataset rows"""
    service = DatasetService(db)
    return await service.get_preview(dataset_id, row_limit)

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a dataset"""
    service = DatasetService(db)
    await service.delete_dataset(dataset_id)
    return {"message": "Dataset deleted"}
