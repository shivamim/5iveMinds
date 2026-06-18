from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class PipelineRunCreate(BaseModel):
    dataset_id: str
    business_question: str = Field(..., min_length=10)
    hitl_agents: Optional[List[str]] = []
    custom_config: Optional[Dict[str, Any]] = {}

class PipelineRunResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    dataset_name: Optional[str] = None
    business_question: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_time_ms: Optional[int] = None
    quality_score_avg: Optional[float] = None
    run_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class DatasetUploadResponse(BaseModel):
    id: str
    dataset_id: Optional[str] = None
    filename: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    file_size_bytes: Optional[int] = None
    dataset_schema: Optional[Dict[str, Any]] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    format: str = "pdf"
    sections: List[str] = ["all"]

class ReportResponse(BaseModel):
    id: UUID
    run_id: UUID
    report_type: str
    content: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
