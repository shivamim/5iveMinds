from fastapi import APIRouter, HTTPException
from typing import List

from app.schemas import AgentInfo, AgentConfig
from app.core.agents.data_engineer import DataEngineerAgent
from app.core.agents.statistician import StatisticianAgent
from app.core.agents.ml_engineer import MLEngineerAgent
from app.core.agents.strategist import StrategistAgent
from app.core.agents.designer import DesignerAgent

router = APIRouter()

AGENTS = [
    AgentInfo(
        name="data_engineer",
        display_name="Data Engineer",
        description="Schema inference, smart imputation, outlier detection, SQL DDL",
        capabilities=["schema_inference", "imputation", "outlier_detection", "sql_ddl"],
        quality_dimensions=["completeness", "consistency", "validity", "uniqueness"]
    ),
    AgentInfo(
        name="statistician",
        display_name="Statistician",
        description="Automated EDA, hypothesis testing, correlation networks",
        capabilities=["eda", "hypothesis_testing", "correlation", "power_analysis"],
        quality_dimensions=["statistical_rigor", "coverage", "test_validity"]
    ),
    AgentInfo(
        name="ml_engineer",
        display_name="ML Engineer",
        description="AutoML, SHAP explainability, feature engineering",
        capabilities=["automl", "shap", "feature_engineering", "model_persistence"],
        quality_dimensions=["performance", "generalization", "explainability"]
    ),
    AgentInfo(
        name="strategist",
        display_name="Strategist",
        description="LLM insights, ROI calculation, scenario simulation",
        capabilities=["business_insights", "roi_calculation", "scenario_sim", "risk_matrix"],
        quality_dimensions=["actionability", "risk_awareness", "business_relevance"]
    ),
    AgentInfo(
        name="designer",
        display_name="Designer",
        description="Executive reports, Plotly charts, dashboard specs",
        capabilities=["report_generation", "chart_specs", "dashboard_config"],
        quality_dimensions=["clarity", "visual_fidelity", "completeness"]
    ),
]

AGENT_CLASS_MAP = {
    "data_engineer": DataEngineerAgent,
    "statistician": StatisticianAgent,
    "ml_engineer": MLEngineerAgent,
    "strategist": StrategistAgent,
    "designer": DesignerAgent,
}

@router.get("/agents", response_model=List[AgentInfo])
async def list_agents():
    return AGENTS

@router.get("/agents/{name}/config")
async def get_agent_config(name: str):
    if name not in AGENT_CLASS_MAP:
        raise HTTPException(404, "Agent not found")
    return {"name": name, "config_schema": AGENT_CLASS_MAP[name].get_config_schema()}
