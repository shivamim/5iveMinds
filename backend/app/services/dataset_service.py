import io, uuid, logging
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Optional
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

    def _compute_rich_profile(self, df: pd.DataFrame) -> dict:
        profile = {"numeric_stats": {}, "categorical_stats": {}, "correlations": [], "missingness": {}, "outliers": {}}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns
        
        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) == 0: continue
            q1, q3 = series.quantile(0.25), series.quantile(0.75)
            iqr = q3 - q1
            profile["outliers"][col] = int(((series < (q1 - 1.5 * iqr)) | (series > (q3 + 1.5 * iqr))).sum())
            try:
                counts, bin_edges = np.histogram(series, bins=min(10, max(3, len(series.unique()))))
                profile["numeric_stats"][col] = {
                    "mean": float(series.mean()), "std": float(series.std()),
                    "histogram": [{"bin": f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}", "count": int(counts[i])} for i in range(len(counts))]
                }
            except: pass
            profile["missingness"][col] = int(df[col].isnull().sum())
            
        for col in categorical_cols:
            counts = df[col].value_counts().head(5)
            profile["categorical_stats"][col] = [{"category": str(k), "count": int(v)} for k, v in counts.items()]
            profile["missingness"][col] = int(df[col].isnull().sum())
            
        # 🧠 CAPTURE RAW SAMPLE DATA FOR REAL ML TRAINING
        # Replace NaN with None so it serializes to JSON safely
        profile["sample_data"] = df.head(1000).replace({np.nan: None}).to_dict(orient="records")
        
        return profile

    async def process_upload(self, file: UploadFile) -> DatasetUploadResponse:
        contents = await file.read()
        try:
            if file.filename.lower().endswith(".csv"):
                try: df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
                except: df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
            else: df = pd.read_excel(io.BytesIO(contents))
        except Exception as e: raise ValueError(f"Failed to parse file: {e}")

        dataset_id = str(uuid.uuid4())
        schema_info = {col: {"type": str(df[col].dtype), "nullable": bool(df[col].isnull().any())} for col in df.columns}
        rich_profile = self._compute_rich_profile(df)
        
        valid_columns = {c.key for c in Dataset.__table__.columns}
        potential_data = {
            "id": dataset_id, "filename": file.filename, "row_count": len(df), "column_count": len(df.columns),
            "file_size_bytes": len(contents), "dataset_schema": schema_info, "schema_info": schema_info,
            "rich_profile": rich_profile, "uploaded_at": datetime.utcnow()
        }
        filtered_data = {k: v for k, v in potential_data.items() if k in valid_columns}
        
        new_dataset = Dataset(**filtered_data)
        self.db.add(new_dataset)
        await self.db.commit()
        await self.db.refresh(new_dataset)

        return DatasetUploadResponse(id=dataset_id, filename=file.filename, row_count=len(df), column_count=len(df.columns))

    async def list_datasets(self, limit: int = 20, offset: int = 0) -> List[Dataset]:
        result = await self.db.execute(select(Dataset).order_by(Dataset.uploaded_at.desc()).offset(offset).limit(limit))
        return result.scalars().all()

    async def get_dataset(self, dataset_id: str) -> Optional[Dataset]:
        result = await self.db.execute(select(Dataset).where(Dataset.id == dataset_id))
        return result.scalar_one_or_none()

    async def delete_dataset(self, dataset_id: str) -> None:
        await self.db.execute(delete(Dataset).where(Dataset.id == dataset_id))
        await self.db.commit()
