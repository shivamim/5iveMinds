from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import io

from app.database import get_async_db
from app.models import PipelineRun, AgentExecution, AgentStatus

router = APIRouter()

@router.get("/reports/{run_id}/pdf")
async def download_pdf_report(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    # 1. Safely import reportlab (prevents startup crash if missing)
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch
    except ImportError:
        raise HTTPException(500, "reportlab not installed on server. Add 'reportlab==4.2.0' to requirements.txt")

    # 2. Fetch Data
    run_res = await db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
    run = run_res.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Run not found")

    execs_res = await db.execute(select(AgentExecution).where(AgentExecution.run_id == run_id))
    execs = {e.agent_name: e for e in execs_res.scalars().all()}

    # 3. Build PDF in Memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(name='CustomTitle', parent=styles['Title'], fontSize=24, spaceAfter=30, textColor=colors.HexColor("#2563EB"))
    heading_style = ParagraphStyle(name='CustomHeading', parent=styles['Heading2'], fontSize=16, spaceAfter=12, textColor=colors.HexColor("#1E293B"))
    body_style = ParagraphStyle(name='CustomBody', parent=styles['BodyText'], fontSize=11, leading=16, spaceAfter=12)

    elements = []

    # --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
    elements.append(Paragraph("FiveMinds Executive Strategy Report", title_style))
    elements.append(Paragraph(f"<b>Business Question:</b> {run.business_question}", body_style))
    elements.append(Paragraph(f"<b>Dataset:</b> {run.dataset_name} | <b>Run ID:</b> {str(run.id)[:8]}...", body_style))
    elements.append(Spacer(1, 20))

    strategist = execs.get("strategist")
    if strategist and strategist.output_data and strategist.output_data.get("report"):
        elements.append(Paragraph("1. Executive Strategy & Recommendations", heading_style))
        for para in strategist.output_data["report"].split("\n\n"):
            if para.strip():
                clean_text = para.replace("**", "<b>").replace("**", "</b>").replace("#", "")
                elements.append(Paragraph(clean_text, body_style))
    
    elements.append(PageBreak())

    # --- PAGE 2: DATA HEALTH & ML ---
    elements.append(Paragraph("2. Data Health & Engineering", heading_style))
    de = execs.get("data_engineer")
    if de and de.output_data:
        data = de.output_data
        table_data = [
            ["Metric", "Value"],
            ["Total Rows", str(data.get("row_count", "N/A"))],
            ["Total Columns", str(data.get("column_count", "N/A"))],
            ["Missing Data", str(data.get("missing_values_pct", "0%"))],
            ["Outliers Detected", str(data.get("outliers_detected", 0))],
            ["Data Quality Score", f"{data.get('quality_score', 'N/A')}/100"]
        ]
        t = Table(table_data, colWidths=[3*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2563EB")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F1F5F9")),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(t)
        
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("3. Machine Learning & Feature Importance", heading_style))
    ml = execs.get("ml_engineer")
    if ml and ml.output_data:
        elements.append(Paragraph(f"<b>Champion Model:</b> {ml.output_data.get('best_model', 'N/A')}", body_style))
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<b>Top Business Drivers (SHAP):</b>", body_style))
        for shap in ml.output_data.get("shap_values", [])[:5]:
            elements.append(Paragraph(f"• <b>{shap.get('feature')}</b>: {shap.get('importance', 0)*100:.1f}% impact on target", body_style))

    # 4. Stream to Browser
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"FiveMinds_Report_{str(run_id)[:8]}.pdf"
    return StreamingResponse(
        buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
