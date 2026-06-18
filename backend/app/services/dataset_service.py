import io
import uuid
import logging
from datetime import datetime
from typing import List, Optional
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import UploadFile

from app.models import Dataset
from app.schemas import DatasetUploadResponse
from app.config import settings

logger = logging.getLogger(__name__)

class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_or_create_bucket(self):
        """Gracefully handle missing supabase package or config."""
        try:
            from supabase import create_client
        except ImportError:
            return None
        
        try:
            supabase_url = getattr(settings, 'SUPABASE_URL', None)
            supabase_key = getattr(settings, 'SUPABASE_KEY', None)
            
            if not supabase_url or not supabase_key:
                logger.warning("SUPABASE_URL or SUPABASE_KEY not set — skipping storage upload")
                return None
            
            sb = create_client(supabase_url, supabase_key)
            bucket_name = getattr(settings, 'SUPABASE_BUCKET', 'datasets')
            bucket = sb.storage.from_(bucket_name)
            return bucket
        except Exception as e:
            logger.warning(f"Supabase init failed: {e}")
            return None

    async def process_upload(self, file: UploadFile) -> DatasetUploadResponse:
        """Process uploaded file: parse, validate, store in DB."""
        contents = await file.read()
        
        # Parse dataframe with encoding fallback
        try:
            if file.filename.lower().endswith(".csv"):
                try:
                    df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
            elif file.filename.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
        except Exception as e:
            logger.error(f"Failed to parse uploaded file: {e}")
            raise ValueError(f"Failed to parse file: {e}")

        if df.empty:
            raise ValueError("Uploaded file contains no data")

        dataset_id = str(uuid.uuid4())
        
        # Build schema information
        schema_info = {}
        for col in df.columns:
            dtype = str(df[col].dtype)
            schema_info[col] = {
                "type": dtype,
                "nullable": bool(df[col].isnull().any()),
                "unique_count": int(df[col].nunique()),
            }

        # Calculate missing value percentage
        total_cells = df.size
        missing_cells = df.isnull().sum().sum()
        missing_pct = f"{(missing_cells / total_cells * 100):.2f}%" if total_cells > 0 else "0%"

        # Try uploading to Supabase Storage (non-fatal)
        storage_url = None
        bucket = self._get_or_create_bucket()
        if bucket:
            try:
                file_ext = file.filename.lower().split('.')[-1]
                storage_path = f"{dataset_id}.{file_ext}"
                bucket.upload(storage_path, contents)
                storage_url = bucket.get_public_url(storage_path)
            except Exception as e:
                logger.warning(f"Supabase storage upload failed: {e}")

        # 🛡️ BULLETPROOF DB SAVE: Dynamically map only to columns that actually exist in your model
        valid_columns = {c.key for c in Dataset.__table__.columns}
        
        potential_data = {
            "id": dataset_id,
            "filename": file.filename,
            "row_count": len(df),
            "column_count": len(df.columns),
            "file_size_bytes": len(contents),
            "dataset_schema": schema_info,
            "schema_info": schema_info,  # Fallback names
            "schema": schema_info,       # Fallback names
            "missing_values_pct": missing_pct,
            "storage_url": storage_url,
            "uploaded_at": datetime.utcnow()
        }
        
        # Filter out any keys that aren't actual columns in your database table
        filtered_data = {k: v for k, v in potential_data.items() if k in valid_columns}
        
        new_dataset = Dataset(**filtered_data)
        
        self.db.add(new_dataset)
        await self.db.commit()
        await self.db.refresh(new_dataset)

        return DatasetUploadResponse(
            id=dataset_id,
            dataset_id=dataset_id,
            filename=file.filename,
            row_count=len(df),
            column_count=len(df.columns),
            file_size_bytes=len(contents),
            dataset_schema=schema_info,
            uploaded_at=new_dataset.uploaded_at if hasattr(new_dataset, 'uploaded_at') else datetime.utcnow()
        )

    async def list_datasets(self, limit: int = 20, offset: int = 0) -> List[Dataset]:
        result = await self.db.execute(
            select(Dataset).order_by(getattr(Dataset, 'uploaded_at', Dataset.id).desc()).offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def get_dataset(self, dataset_id: str) -> Optional[Dataset]:
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        return result.scalar_one_or_none()

    async def delete_dataset(self, dataset_id: str) -> None:
        await self.db.execute(delete(Dataset).where(Dataset.id == dataset_id))
        await self.db.commit()
