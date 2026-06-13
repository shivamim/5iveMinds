from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
import uuid
from datetime import datetime

from app.models import Report, PipelineRun, ReportType, AgentExecution
from app.schemas import ReportResponse

class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_generate_report(self, run_id: uuid.UUID, report_type: str) -> Report:
        """Get existing report or auto-generate one from pipeline results."""
        result = await self.db.execute(
            select(Report).where(
                Report.pipeline_run_id == run_id,
                Report.report_type == ReportType(report_type)
            )
        )
        report = result.scalar_one_or_none()
        if report:
            return report

        # Auto-generate from agent outputs
        run_result = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = run_result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Pipeline run not found")

        exec_result = await self.db.execute(
            select(AgentExecution).where(AgentExecution.pipeline_run_id == run_id)
        )
        executions = {e.agent_name: e.output_data or {} for e in exec_result.scalars().all()}

        content = self._generate_report_content(run, executions, report_type)

        report = Report(
            pipeline_run_id=run_id,
            report_type=ReportType(report_type),
            content=content,
            generated_at=datetime.utcnow()
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    def _generate_report_content(self, run, executions: dict, report_type: str) -> str:
        de = executions.get("data_engineer", {})
        stats = executions.get("statistician", {})
        ml = executions.get("ml_engineer", {})
        strategy = executions.get("strategist", {})

        lines = [
            f"# FiveMinds {report_type.title()} Report",
            f"**Dataset:** {run.dataset_name}",
            f"**Question:** {run.business_question}",
            f"**Quality Score:** {run.quality_score_avg:.1f}%" if run.quality_score_avg else "",
            "",
            "## Executive Summary",
            f"Analysis completed across {run.dataset_name} using 5 autonomous AI agents.",
            "",
            "## Data Quality",
            f"- Rows analyzed: {de.get('row_count', 'N/A')}",
            f"- Missing values: {de.get('missing_values_pct', 0)}%",
            f"- Outliers detected: {de.get('outliers_detected', 0)}%",
            "",
            "## Statistical Insights",
            f"- Significant correlations: {stats.get('significant_correlations', 0)}",
        ]
        for insight in stats.get("insights", []):
            lines.append(f"- {insight}")

        lines += [
            "",
            "## ML Results",
            f"- Best model: {ml.get('best_model', 'N/A')}",
            f"- R² score: {ml.get('best_r2', 'N/A')}",
            "",
            "## Strategic Recommendations",
        ]
        for rec in strategy.get("recommended_actions", []):
            lines.append(f"- **{rec.get('action')}** ({rec.get('priority')} priority) — {rec.get('timeline')}")

        return "\n".join(lines)

    async def get_report(self, run_id: uuid.UUID, report_type: str) -> ReportResponse:
        report = await self.get_or_generate_report(run_id, report_type)
        return ReportResponse(
            id=report.id,
            report_type=report.report_type.value,
            content=report.content,
            generated_at=report.generated_at
        )

    async def export_report(self, run_id: uuid.UUID, format: str, sections: list) -> str:
        return f"/api/v1/reports/{run_id}/download?format={format}"
