from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_async_db
from app.schemas import AgentInfo, AgentResponse

router = APIRouter()

@router.get("/agents", response_model=List[AgentInfo])
async def list_agents():
    """List all available AI agents."""
    return [
        AgentInfo(name="data_engineer", role="Data Preparation", description="Cleans and prepares data."),
        AgentInfo(name="statistician", role="Statistical Analysis", description="Performs EDA and hypothesis testing."),
        AgentInfo(name="ml_engineer", role="Machine Learning", description="Trains models and calculates SHAP values."),
        AgentInfo(name="strategist", role="Business Strategy", description="Generates executive insights and ROI."),
        AgentInfo(name="designer", role="Visualization", description="Creates charts and compiles reports.")
    ]

@router.get("/agents/{agent_name}", response_model=AgentInfo)
async def get_agent(agent_name: str):
    """Get details for a specific agent."""
    return AgentInfo(name=agent_name, role="Specialist", description=f"Details for {agent_name}.")
