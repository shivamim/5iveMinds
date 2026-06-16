from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from uuid import UUID


# Pipeline schemas
class PipelineRunCreate(BaseModel):
    dataset_id: UUID
    business_question: str = Field(..., min_length=10, max_length=500)
    hitl_agents: Optional[List[str]] = []
    custom_config: Optional[Dict[str, Any]] = {}


class PipelineRunResponse(BaseModel):
    id: UUID
    status: str
    # FIXED: Was Optional[str], must be Optional[UUID] to match the SQLAlchemy UUID type
    dataset_id: Optional[UUID] = None
    dataset_name: str
    business_question: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    total_time_ms: Optional[int]
    quality_score_avg: Optional[float]
    run_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AgentExecutionResponse(BaseModel):
    id: UUID
    agent_name: str
    status: str
    quality_score: Optional[float]
    execution_time_ms: Optional[int]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PipelineStatusResponse(BaseModel):
    run: PipelineRunResponse
    executions: List[AgentExecutionResponse]
    progress_percent: float


# Dataset schemas
class DatasetUploadResponse(BaseModel):
    id: UUID
    filename: str
    row_count: int
    column_count: int
    file_size_bytes: int
    dataset_schema: Dict[str, Any]
    uploaded_at: datetime


class DatasetPreview(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    sample_size: int


# Report schemas
class ReportResponse(BaseModel):
    id: UUID
    report_type: str
    content: str
    generated_at: datetime


class ExportRequest(BaseModel):
    format: Literal["pdf", "excel", "pptx", "html"]
    sections: Optional[List[str]] = ["all"]


# Chart schemas
class ChartResponse(BaseModel):
    id: UUID
    agent_name: str
    chart_type: str
    chart_data: Dict[str, Any]
    plotly_spec: Optional[Dict[str, Any]]


# Agent schemas
class AgentInfo(BaseModel):
    name: str
    display_name: str
    description: str
    capabilities: List[str]
    quality_dimensions: List[str]


class AgentConfig(BaseModel):
    name: str
    config: Dict[str, Any]


# WebSocket messages
class PipelineProgressMessage(BaseModel):
    type: Literal[
        "agent_started",
        "agent_progress",
        "agent_completed",
        "agent_failed",
        "pipeline_completed",
    ]
    run_id: UUID
    agent_name: Optional[str]
    progress: Optional[float]
    quality_score: Optional[float]
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Auth schemas
class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
