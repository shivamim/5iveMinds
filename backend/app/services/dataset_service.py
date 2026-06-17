import logging
from typing import Dict
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import io
from datetime import datetime, timezone

from app.models import Dataset
from app.schemas import DatasetUploadResponse
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory cache for dataframes - keyed by dataset UUID string
# NOTE: For multi-worker deployments (Railway), consider using Redis
_dataset_cache: Dict[str, pd.DataFrame] = {}

def _get_or_create_bucket():
    try:
        from supabase import create_client
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return None
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return sb.storage.from_(settings.SUPABASE_BUCKET)
    except Exception:
        return None

class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_upload(self, file) -> DatasetUploadResponse:
        contents = await file.read()
        if not contents:
            raise ValueError("Empty file")

        # Parse dataframe
        try:
            if file.filename.lower().endswith(".csv"):
                df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
            elif file.filename.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
        except Exception as e:
            logger.error(f"Failed to parse uploaded file: {e}")
            raise ValueError(f"Failed to parse file: {e}")

        row_count = len(df)
        column_count = len(df.columns)

        # Build real schema with actual pandas dtypes
        schema = {}
        column_stats = {}
        for col in df.columns:
            dtype = str(df[col].dtype)
            null_count = int(df[col].isnull().sum())
            unique_count = int(df[col].nunique(dropna=False))

            if pd.api.types.is_numeric_dtype(df[col]):
                type_category = "numeric"
                col_min = float(df[col].min()) if not df[col].dropna().empty else None
                col_max = float(df[col].max()) if not df[col].dropna().empty else None
                col_mean = float(df[col].mean()) if not df[col].dropna().empty else None
                col_std = float(df[col].std()) if not df[col].dropna().empty else None
                column_stats[col] = {
                    "type": type_category,
                    "dtype": dtype,
                    "null_count": null_count,
                    "null_pct": round(null_count / row_count * 100, 2) if row_count > 0 else 0,
                    "unique_count": unique_count,
                    "min": col_min,
                    "max": col_max,
                    "mean": col_mean,
                    "std": col_std,
                }
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                type_category = "datetime"
                column_stats[col] = {
                    "type": type_category,
                    "dtype": dtype,
                    "null_count": null_count,
                    "null_pct": round(null_count / row_count * 100, 2) if row_count > 0 else 0,
                    "unique_count": unique_count,
                }
            elif pd.api.types.is_bool_dtype(df[col]):
                type_category = "boolean"
                true_count = int(df[col].sum()) if not df[col].dropna().empty else 0
                column_stats[col] = {
                    "type": type_category,
                    "dtype": dtype,
                    "null_count": null_count,
                    "null_pct": round(null_count / row_count * 100, 2) if row_count > 0 else 0,
                    "unique_count": unique_count,
                    "true_count": true_count,
                    "false_count": int(df[col].notna().sum()) - true_count,
                }
            else:
                type_category = "categorical"
                value_counts = df[col].value_counts().head(10).to_dict()
                value_counts = {str(k): int(v) for k, v in value_counts.items()}
                column_stats[col] = {
                    "type": type_category,
                    "dtype": dtype,
                    "null_count": null_count,
                    "null_pct": round(null_count / row_count * 100, 2) if row_count > 0 else 0,
                    "unique_count": unique_count,
                    "top_values": value_counts,
                }

            schema[col] = {
                "type": type_category,
                "dtype": dtype,
                "null_count": null_count,
                "null_pct": round(null_count / row_count * 100, 2) if row_count > 0 else 0,
                "unique_count": unique_count,
            }

        # Store sample data
        sample_data = []
        try:
            sample_df = df.head(5)
            for _, row in sample_df.iterrows():
                row_dict = {}
                for col in df.columns:
                    val = row[col]
                    if pd.isna(val):
                        row_dict[col] = None
                    elif isinstance(val, (np.integer, np.floating)):
                        row_dict[col] = float(val)
                    elif isinstance(val, pd.Timestamp):
                        row_dict[col] = val.isoformat()
                    else:
                        row_dict[col] = str(val)
                sample_data.append(row_dict)
        except Exception as e:
            logger.warning(f"Failed to create sample data: {e}")

        # Upload to Supabase Storage
        bucket = _get_or_create_bucket()
        blob_url = None
        try:
            if bucket:
                upload_path = f"datasets/{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{file.filename}"
                bucket.upload(upload_path, contents)
                blob_url = bucket.get_public_url(upload_path)
        except Exception as e:
            logger.warning(f"Supabase upload failed (storing locally): {e}")

        # Save to DB
        ds = Dataset(
            filename=file.filename,
            original_path=blob_url or "memory",
            blob_url=blob_url,
            row_count=row_count,
            column_count=column_count,
            file_size_bytes=len(contents),
            schema=schema,
            column_stats=column_stats,
            sample_data=sample_data,
        )
        self.db.add(ds)
        await self.db.commit()
        await self.db.refresh(ds)

        _dataset_cache[str(ds.id)] = df
        logger.info(
            f"Dataset {ds.id} ({file.filename}) uploaded: "
            f"{row_count} rows, {column_count} columns"
        )

        return DatasetUploadResponse(
            id=ds.id,
            filename=ds.filename,
            row_count=ds.row_count,
            column_count=ds.column_count,
            file_size_bytes=ds.file_size_bytes,
            dataset_schema=ds.schema,
            uploaded_at=ds.uploaded_at,
        )

    async def list_datasets(self, limit: int, offset: int):
        result = await self.db.execute(
            select(Dataset).order_by(Dataset.uploaded_at.desc()).offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def get_preview(self, dataset_id, row_limit: int = 100):
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        ds = result.scalar_one_or_none()
        if not ds:
            from fastapi import HTTPException
            raise HTTPException(404, "Dataset not found")

        df = _dataset_cache.get(str(dataset_id))
        if df is None and ds.blob_url:
            try:
                if ds.filename.lower().endswith(".csv"):
                    df = pd.read_csv(ds.blob_url)
                else:
                    df = pd.read_excel(ds.blob_url)
                _dataset_cache[str(dataset_id)] = df
            except Exception:
                df = None

        if df is None:
            from fastapi import HTTPException
            raise HTTPException(404, "Dataset data not available")

        preview_df = df.head(row_limit)
        return {
            "columns": list(df.columns),
            "rows": preview_df.to_dict(orient="records"),
            "total_rows": len(df),
            "sample_size": len(preview_df),
        }

    async def delete_dataset(self, dataset_id):
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        ds = result.scalar_one_or_none()
        if not ds:
            from fastapi import HTTPException
            raise HTTPException(404, "Dataset not found")
        _dataset_cache.pop(str(dataset_id), None)
        await self.db.execute(delete(Dataset).where(Dataset.id == dataset_id))
        await self.db.commit()
        logger.info(f"Dataset {dataset_id} deleted")

    def get_cached_dataframe(self, dataset_id: str) -> pd.DataFrame | None:
        return _dataset_cache.get(dataset_id)
