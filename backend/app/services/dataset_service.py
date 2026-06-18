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
        """✅ Gracefully handle missing supabase package or config."""
        try:
            from supabase import create_client
        except ImportError:
            logger.warning(
                "supabase package not installed — files will only be "
                "stored in DB, not Supabase Storage"
            )
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
            
            # ✅ Try to create bucket if it doesn't exist (non-fatal)
            try:
                sb.storage.create_bucket(bucket_name)
                logger.info(f"Created Supabase bucket: {bucket_name}")
            except Exception:
                # Bucket likely already exists — that's fine
                pass
            
            return bucket
        except Exception as e:
            logger.warning(f"Supabase init failed: {e}")
            return None

    async def process_upload(self, file: UploadFile) -> DatasetUploadResponse:
        """Process uploaded file: parse, validate, store in DB and optionally Supabase Storage."""
        contents = await file.read()
        
        # ✅ Parse dataframe with encoding fallback
        try:
            if file.filename.lower().endswith(".csv"):
                # ✅ Try UTF-8 first, fall back to latin-1 for files with BOM or special chars
                try:
                    df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
                except Exception:
                    # Last resort: try with errors='replace'
                    df = pd.read_csv(
                        io.BytesIO(contents), 
                        encoding="utf-8", 
                        encoding_errors="replace"
                    )
            elif file.filename.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
        except Exception as e:
            logger.error(f"Failed to parse uploaded file: {e}")
            raise ValueError(f"Failed to parse file: {e}")

        if df.empty:
            raise ValueError("Uploaded file contains no data")

        # Generate dataset ID
        dataset_id = str(uuid.uuid4())
        
        # Build schema information
        schema_info = {}
        for col in df.columns:
            dtype = str(df[col].dtype)
            schema_info[col] = {
                "type": dtype,
                "nullable": bool(df[col].isnull().any()),
                "unique_count": int(df[col].nunique()),
                "sample_values": df[col].dropna().head(3).tolist()
            }

        # Calculate missing value percentage
        total_cells = df.size
        missing_cells = df.isnull().sum().sum()
        missing_pct = f"{(missing_cells / total_cells * 100):.2f}%" if total_cells > 0 else "0%"

        # ✅ Try uploading to Supabase Storage (non-fatal if it fails)
        storage_url = None
        bucket = self._get_or_create_bucket()
        if bucket:
            try:
                file_ext = file.filename.lower().split('.')[-1]
                storage_path = f"{dataset_id}.{file_ext}"
                bucket.upload(storage_path, contents)
                storage_url = bucket.get_public_url(storage_path)
                logger.info(f"Uploaded to Supabase Storage: {storage_path}")
            except Exception as e:
                logger.warning(f"Supabase storage upload failed: {e}")

        # ✅ Save to database
        new_dataset = Dataset(
            id=dataset_id,
            filename=file.filename,
            row_count=len(df),
            column_count=len(df.columns),
            file_size_bytes=len(contents),
            dataset_schema=schema_info,
            missing_values_pct=missing_pct,
            storage_url=storage_url,
            uploaded_at=datetime.utcnow()
        )
        
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
            uploaded_at=new_dataset.uploaded_at
        )

    async def list_datasets(self, limit: int = 20, offset: int = 0) -> List[Dataset]:
        """List all datasets with pagination."""
        result = await self.db.execute(
            select(Dataset).order_by(Dataset.uploaded_at.desc()).offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def get_dataset(self, dataset_id: str) -> Optional[Dataset]:
        """Get a specific dataset by ID."""
        result = await self.db.execute(
            select(Dataset).where(Dataset.id == dataset_id)
        )
        return result.scalar_one_or_none()

    async def delete_dataset(self, dataset_id: str) -> None:
        """Delete a dataset from the database."""
        await self.db.execute(
            delete(Dataset).where(Dataset.id == dataset_id)
        )
        await self.db.commit()
