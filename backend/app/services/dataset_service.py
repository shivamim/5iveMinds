import pandas as pd
import io
import uuid
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile, HTTPException

from app.models import Dataset
from app.schemas import DatasetUploadResponse, DatasetPreview

# In-memory cache: dataset_id -> DataFrame (cleared on restart)
_dataset_cache: Dict[str, pd.DataFrame] = {}

class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_upload(self, file: UploadFile) -> DatasetUploadResponse:
        content = await file.read()
        fname = file.filename or "upload.csv"

        if fname.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8', errors='replace')))
        elif fname.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        elif fname.endswith('.parquet'):
            df = pd.read_parquet(io.BytesIO(content))
        else:
            raise HTTPException(400, "Unsupported format. Use CSV, Excel, or Parquet.")

        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]

        schema = {}
        for col in df.columns:
            schema[col] = {
                "type": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "sample_values": [str(v) for v in df[col].dropna().head(5).tolist()],
            }

        dataset = Dataset(
            filename=fname,
            original_path=f"uploads/{uuid.uuid4()}_{fname}",
            row_count=len(df),
            column_count=len(df.columns),
            file_size_bytes=len(content),
            schema=schema,  # <-- FIXED: was dataset_schema
        )
        self.db.add(dataset)
        await self.db.commit()
        await self.db.refresh(dataset)

        # Cache the dataframe
        _dataset_cache[str(dataset.id)] = df

        return DatasetUploadResponse(
            id=dataset.id,
            filename=dataset.filename,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            file_size_bytes=dataset.file_size_bytes,
            dataset_schema=dataset.schema,
            uploaded_at=dataset.uploaded_at,
        )

    async def list_datasets(self, limit: int, offset: int):
        result = await self.db.execute(
            select(Dataset).order_by(Dataset.uploaded_at.desc()).offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def get_preview(self, dataset_id: uuid.UUID, row_limit: int) -> DatasetPreview:
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise HTTPException(404, "Dataset not found")

        # Use cache if available
        df = _dataset_cache.get(str(dataset_id))
        if df is not None:
            sample = df.head(row_limit)
            rows = []
            for _, row in sample.iterrows():
                rows.append({col: (None if pd.isna(v) else v) for col, v in row.items()})
            return DatasetPreview(
                columns=list(df.columns),
                rows=rows,
                total_rows=len(df),
                sample_size=len(rows),
            )

        # Fallback: schema-only preview
        return DatasetPreview(
            columns=list((dataset.schema or {}).keys()),
            rows=[],
            total_rows=dataset.row_count,
            sample_size=0,
        )

    async def delete_dataset(self, dataset_id: uuid.UUID):
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise HTTPException(404, "Dataset not found")
        _dataset_cache.pop(str(dataset_id), None)
        await self.db.delete(dataset)
        await self.db.commit()
