import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

# ==========================================
# PYTHON ENUMS
# ==========================================
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

# ==========================================
# DATASET MODEL
# ==========================================
class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    missing_values_pct = Column(String, nullable=True)
    storage_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

# ==========================================
# PIPELINE RUN MODEL (FIXED ENUM CASTING)
# ==========================================
class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), nullable=False)
    dataset_name = Column(String, nullable=True)
    dataset_path = Column(String, nullable=True)
    business_question = Column(String, nullable=False)
    
    # ✅ CRITICAL FIX: Maps to the native 'pipelinestatus' ENUM in Supabase
    status = Column(
        PG_ENUM(PipelineStatus, name="pipelinestatus", create_type=False),
        default=PipelineStatus.QUEUED,
        nullable=False
    )
    
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_time_ms = Column(Integer, nullable=True)
    quality_score_avg = Column(Float, nullable=True)
    created_by = Column(String, nullable=True)
    run_metadata = Column(JSON, nullable=True)

    executions = relationship("AgentExecution", back_populates="run", cascade="all, delete-orphan")

# ==========================================
# AGENT EXECUTION MODEL
# ==========================================
class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String, nullable=False)
    
    # Maps to native 'agentstatus' ENUM (if it exists, otherwise falls back to string safely)
    status = Column(
        PG_ENUM(AgentStatus, name="agentstatus", create_type=False),
        default=AgentStatus.PENDING,
        nullable=False
    )
    
    quality_score = Column(Float, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    run = relationship("PipelineRun", back_populates="executions")
