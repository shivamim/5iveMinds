from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class PipelineStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AgentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class ReportType(str, enum.Enum):
    EXECUTIVE = "executive"
    TECHNICAL = "technical"
    SUMMARY = "summary"

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(Enum(PipelineStatus), default=PipelineStatus.QUEUED)
    dataset_name = Column(String(255))
    dataset_path = Column(Text)
    business_question = Column(Text)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    total_time_ms = Column(Integer)
    quality_score_avg = Column(Float)
    created_by = Column(String(255))
    run_metadata = Column(JSON)

    executions = relationship("AgentExecution", back_populates="pipeline_run", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="pipeline_run", cascade="all, delete-orphan")
    charts = relationship("Chart", back_populates="pipeline_run", cascade="all, delete-orphan")

class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id"))
    agent_name = Column(String(50))
    status = Column(Enum(AgentStatus), default=AgentStatus.PENDING)
    quality_score = Column(Float)
    execution_time_ms = Column(Integer)
    output_data = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    pipeline_run = relationship("PipelineRun", back_populates="executions")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255))
    original_path = Column(Text)
    blob_url = Column(Text)
    row_count = Column(Integer)
    column_count = Column(Integer)
    file_size_bytes = Column(Integer)
    schema = Column(JSON)
    uploaded_by = Column(String(255))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id"))
    report_type = Column(Enum(ReportType))
    content = Column(Text)
    file_path = Column(Text)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    pipeline_run = relationship("PipelineRun", back_populates="reports")

class Chart(Base):
    __tablename__ = "charts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id"))
    agent_name = Column(String(50))
    chart_type = Column(String(50))
    chart_data = Column(JSON)
    plotly_spec = Column(JSON)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    pipeline_run = relationship("PipelineRun", back_populates="charts")
