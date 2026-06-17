import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, update
from fastapi import HTTPException
from datetime import datetime
import uuid
import time
from typing import Any, Optional

from app.models import (
    PipelineRun,
    AgentExecution,
    PipelineStatus,
    AgentStatus,
    Dataset,
    Chart,
    Report,
)
from app.schemas import PipelineRunCreate, PipelineStatusResponse
from app.core.orchestrator import Orchestrator
from app.core.message_board import MessageBoard
from app.core.agents.data_engineer import DataEngineerAgent
from app.core.agents.statistician import StatisticianAgent
from app.core.agents.ml_engineer import MLEngineerAgent
from app.core.agents.strategist import StrategistAgent
from app.core.agents.designer import DesignerAgent
from app.services.websocket_manager import WebSocketManager
from app.services.dataset_service import DatasetService
from app.services.chart_service import ChartService
