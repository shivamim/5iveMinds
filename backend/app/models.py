import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship, declarative_base

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

class ReportType(str, enum.Enum):
    EXECUTIVE = "executive"
    TECHNICAL = "technical"
    SUMMARY = "summary"

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    missing_values_pct = Column(String, nullable=True)
    storage_url = Column(String, nullable=True)
    dataset_schema = Column(JSON, nullable=True)
    rich_profile = Column(JSON, nullable=True) # 🧠 Stores real histograms & correlations
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), nullable=False)
    dataset_name = Column(String, nullable=True)
    dataset_path = Column(String, nullable=True)
    business_question = Column(String, nullable=False)
    status = Column(PG_ENUM(PipelineStatus, name="pipelinestatus", create_type=False), default=PipelineStatus.QUEUED, nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_time_ms = Column(Integer, nullable=True)
    quality_score_avg = Column(Float, nullable=True)
    created_by = Column(String, nullable=True)
    run_metadata = Column(JSON, nullable=True)
    executions = relationship("AgentExecution", back_populates="run", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="run", cascade="all, delete-orphan")

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String, nullable=False)
    status = Column(PG_ENUM(AgentStatus, name="agentstatus", create_type=False), default=AgentStatus.PENDING, nullable=False)
    quality_score = Column(Float, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    run = relationship("PipelineRun", back_populates="executions")

class Report(Base):
    __tablename__ = "reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    run = relationship("PipelineRun", back_populates="reports")
