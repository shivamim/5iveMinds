from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# ==========================================
# AUTH SCHEMAS
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    is_active: bool = True
    class Config:
        from_attributes = True

# ==========================================
# DATASET SCHEMAS
# ==========================================
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

class DatasetResponse(BaseModel):
    id: str
    filename: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ==========================================
# PIPELINE SCHEMAS
# ==========================================
class PipelineRunCreate(BaseModel):
    dataset_id: str
    business_question: str = Field(..., min_length=10)
    goal: Optional[str] = None
    query: Optional[str] = None
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

class AgentExecutionResponse(BaseModel):
    id: UUID
    agent_name: str
    status: str
    quality_score: Optional[float] = None
    execution_time_ms: Optional[int] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class PipelineStatusResponse(BaseModel):
    run: PipelineRunResponse
    executions: List[AgentExecutionResponse]
    progress_percent: float
    status: Optional[str] = None
    pipeline_status: Optional[str] = None
    error: Optional[str] = None

class PipelineResultsResponse(BaseModel):
    run: PipelineRunResponse
    executions: Dict[str, Any]
    charts: List[Any]
    reports: List[Any]
    agent_outputs: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    report: Optional[str] = None

# ==========================================
# CHART SCHEMAS (FIXES THE CURRENT CRASH)
# ==========================================
class ChartBase(BaseModel):
    chart_type: str
    chart_data: Any
    title: Optional[str] = None

class ChartCreate(ChartBase):
    run_id: UUID
    agent_name: str

class ChartResponse(ChartBase):
    id: UUID
    run_id: UUID
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ==========================================
# REPORT SCHEMAS
# ==========================================
class ExportRequest(BaseModel):
    format: str = "pdf"
    sections: List[str] = ["all"]

class GenerateReportRequest(BaseModel):
    run_id: str
    format: str = "pdf"
    sections: List[str] = ["all"]

class ReportResponse(BaseModel):
    id: UUID
    run_id: UUID
    report_type: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ==========================================
# AGENT SCHEMAS
# ==========================================
class AgentInfo(BaseModel):
    name: str
    role: str
    description: str
    status: str = "active"

class AgentResponse(BaseModel):
    id: UUID
    name: str
    status: str
    last_run: Optional[datetime] = None
    class Config:
        from_attributes = True
