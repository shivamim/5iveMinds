import logging
from typing import Dict, Any, Optional
from app.core.agents.base import BaseAgent, call_groq

logger = logging.getLogger(__name__)

class StrategistAgent(BaseAgent):
    """
    Strategist Agent - Generates data-driven business insights
    using real dataset context. Falls back to smart template-based
    insights that reference actual column names when LLM is unavailable.
    """

    async def execute(self) -> Dict[str, Any]:
        stats = self.board.get("statistics", {})
        ml = self.board.get("ml_results", {})
        data_quality = self.board.get("data_quality", {})
        dataset = self.board.get("dataset", {})

        columns = dataset.get("columns", [])
        schema = dataset.get("schema", {})
        column_stats = dataset.get("column_stats", {})
        row_count = dataset.get("row_count", 0)
        filename = dataset.get("filename", "unknown")

        logger.info(f"Strategist analyzing results for {filename}")

        # Build rich context from actual data
        column_summary = []
        for col in columns[:10]:
            stat = column_stats.get(col, {})
            col_type = stat.get("type", "unknown")
            null_pct = stat.get("null_pct", 0)
            unique_count = stat.get("unique_count", 0)

            if col_type == "numeric":
                column_summary.append(
                    f"{col} (numeric): mean={stat.get('mean')}, "
                    f"range=[{stat.get('min')}, {stat.get('max')}], "
                    f"null={null_pct}%"
                )
            elif col_type == "categorical":
                top_vals = list(stat.get("top_values", {}).keys())[:3]
                column_summary.append(
                    f"{col} (categorical): {unique_count} unique, "
                    f"top=[{', '.join(map(str, top_vals))}], null={null_pct}%"
                )
            else:
                column_summary.append(f"{col} ({col_type}): null={null_pct}%")

        correlations_summary = []
        for corr in stats.get("correlations", [])[:5]:
            correlations_summary.append(
                f"{corr['var1']} vs {corr['var2']}: r={corr['correlation']} "
                f"({corr.get('relationship', '')})"
            )

        feature_importance = ml.get("feature_importance", {})
        top_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5] if feature_importance else []

        # FIXED: Shorter prompt to avoid Groq 400 errors (max 1024 tokens for 8b model)
        prompt = f"""Analyze dataset and return ONLY JSON.

Dataset: {filename} | {row_count} records | {len(columns)} columns
Quality: {data_quality.get('quality_score', 'N/A')}/100
Columns: {', '.join(columns[:5])}

Correlations: {len(stats.get('correlations', []))} analyzed
Best Model: {ml.get('best_model', 'N/A')} (R2={ml.get('best_r2', 'N/A')})
Top Features: {', '.join([f'{k}={v:.2f}' for k,v in top_features])}

Return ONLY this JSON (no markdown, no explanation):
{{"executive_summary":"2-3 sentence summary","business_insights":["insight 1","insight 2","insight 3"],"recommended_actions":[{{"action":"action 1","priority":"High","timeline":"1 week"}}],"recommendations":[{{"recommendation":"rec 1","priority":"High","timeline":"1 week","expected_outcome":"result"}}],"roi_projection":{{"conservative":"+10%","moderate":"+20%","optimistic":"+30%"}},"risk_matrix":[{{"risk":"risk 1","likelihood":"Medium","impact":"High"}}]}}"""

        # Try LLM with fallback
        groq_insights = None
        llm_success = False
        try:
            # FIXED: Use smaller max_tokens to avoid 400 error
            groq_insights = await call_groq(prompt, max_tokens=800)
            if groq_insights and isinstance(groq_insights, dict):
                if groq_insights.get("business_insights") or groq_insights.get("recommended_actions"):
                    llm_success = True
                    logger.info("Strategist received LLM-powered insights")
                else:
                    logger.warning("LLM returned valid JSON but missing required fields")
                    groq_insights = None
            else:
                logger.warning("LLM returned invalid format, using fallback")
        except Exception as e:
            logger.warning(f"Groq call failed, using template-based insights: {e}")

        # Generate fallback insights if LLM failed
        if not groq_insights or not isinstance(groq_insights, dict):
            groq_insights = self._generate_data_driven_insights(
                columns, column_stats, schema, stats, ml, row_count, filename
            )

        # Extract data from LLM or fallback
        business_insights = groq_insights.get("business_insights", []) if isinstance(groq_insights, dict) else []
        recommended_actions = groq_insights.get("recommended_actions", []) if isinstance(groq_insights, dict) else []
        recommendations = groq_insights.get("recommendations", []) if isinstance(groq_insights, dict) else []
        roi_projection = groq_insights.get("roi_projection", {}) if isinstance(groq_insights, dict) else {}
        risk_matrix = groq_insights.get("risk_matrix", []) if isinstance(groq_insights, dict) else []

        # Validate and sanitize ROI values
        roi_projection = self._sanitize_roi(roi_projection)

        # Build recommendations from recommended_actions if empty
        if not recommendations and recommended_actions:
            for action in recommended_actions:
                if isinstance(action, dict):
                    recommendations.append({
                        "recommendation": action.get("action", ""),
                        "priority": action.get("priority", "Medium"),
                        "timeline": action.get("timeline", "TBD"),
                        "expected_outcome": action.get("expected_impact", "Improved performance"),
                    })

        # Derive executive_summary from insights if not provided
        executive_summary = groq_insights.get("executive_summary", "") if isinstance(groq_insights, dict) else ""
        if not executive_summary and business_insights:
            summary_parts = business_insights[:2] if isinstance(business_insights, list) else []
            executive_summary = " ".join([str(s) for s in summary_parts])
            if len(executive_summary) > 300:
                executive_summary = executive_summary[:297] + "..."

        # Derive key_findings from insights if not provided
        key_findings = groq_insights.get("key_findings", []) if isinstance(groq_insights, dict) else []
        if not key_findings and business_insights:
            key_findings = business_insights[:4] if isinstance(business_insights, list) else []

        # Derive business_impact from roi_projection if not provided
        business_impact = groq_insights.get("business_impact", {}) if isinstance(groq_insights, dict) else {}
        if not business_impact:
            business_impact = roi_projection

        result = {
            "quality_score": round(min(75 + len(business_insights) * 3 + len(recommended_actions) * 2, 96), 1),
            "llm_powered": llm_success,
            "business_insights": business_insights if isinstance(business_insights, list) else [],
            "roi_projection": roi_projection,
            "risk_matrix": risk_matrix if risk_matrix else self._default_risks(column_stats),
            "recommended_actions": recommended_actions if isinstance(recommended_actions, list) else [],
            "scenario_simulations": self._calculate_scenarios(roi_projection),
            # Frontend-compatible fields - always populated
            "executive_summary": executive_summary or f"Analysis of '{filename}' reveals key insights from {len(columns)} columns.",
            "key_findings": key_findings if isinstance(key_findings, list) else [],
            "recommendations": recommendations if isinstance(recommendations, list) else [],
            "business_impact": business_impact if isinstance(business_impact, dict) else roi_projection,
            "model_performance": {
                "best_model": ml.get("best_model", "N/A"),
                "r2": ml.get("best_r2", "N/A"),
                "rmse": ml.get("best_rmse", "N/A"),
                "quality_score": ml.get("quality_score", "N/A"),
            }
        }

        self.board.post("strategy", result)
        logger.info(f"Strategist complete: {len(business_insights)} insights, LLM={llm_success}")
        return result

    def _generate_data_driven_insights(
        self, columns: list, column_stats: dict, schema: dict,
        stats: dict, ml: dict, row_count: int, filename: str
    ) -> dict:
        """Generate insights that reference actual column names and data characteristics."""
        insights = []
        actions = []

        # Insight 1: Data quality overview
        quality_score = ml.get("data_profile", {}).get("data_quality_score", 50)
        if quality_score < 80:
            insights.append(
                f"Data quality score of {quality_score:.0f}/100 for '{filename}' indicates "
                f"cleanup needed before production deployment"
            )
        else:
            insights.append(
                f"Strong data quality ({quality_score:.0f}/100) in '{filename}' with "
                f"{row_count:,} records provides reliable foundation for analysis"
            )

        # Insight 2: Top correlations
        correlations = stats.get("correlations", [])
        significant = [c for c in correlations if c.get("significant")]
        if significant:
            top_corr = significant[0]
            insights.append(
                f"Strong {'positive' if top_corr['correlation'] > 0 else 'negative'} relationship "
                f"detected between '{top_corr['var1']}' and '{top_corr['var2']}' "
                f"(r={top_corr['correlation']}) — key driver for modeling"
            )
        elif correlations:
            insights.append(
                f"Weak correlations across {len(columns)} variables suggest "
                f"non-linear relationships or need for feature engineering"
            )

        # Insight 3: Feature importance
        feature_importance = ml.get("feature_importance", {})
        if feature_importance:
            top_feature = max(feature_importance.items(), key=lambda x: x[1])
            insights.append(
                f"'{top_feature[0]}' emerges as top predictive feature "
                f"({top_feature[1]*100:.1f}% importance) — prioritize data collection here"
            )

        # Insight 4: Column-specific insights
        numeric_cols = [c for c in columns if column_stats.get(c, {}).get("type") == "numeric"]
        cat_cols = [c for c in columns if column_stats.get(c, {}).get("type") == "categorical"]

        if len(numeric_cols) >= 3:
            insights.append(
                f"Dataset contains {len(numeric_cols)} numeric and {len(cat_cols)} categorical features — "
                f"suitable for ensemble methods with proper encoding"
            )
        elif len(cat_cols) > len(numeric_cols):
            insights.append(
                f"Categorical-dominant schema ({len(cat_cols)} vs {len(numeric_cols)} numeric) — "
                f"consider target encoding or embedding approaches"
            )

        # Insight 5: Missing data
        cols_with_nulls = [
            c for c in columns
            if column_stats.get(c, {}).get("null_pct", 0) > 5
        ]
        if cols_with_nulls:
            insights.append(
                f"Missing data detected in {', '.join(cols_with_nulls[:3])} — "
                f"imputation strategy will impact model reliability"
            )

        # Action recommendations based on actual findings
        if cols_with_nulls:
            actions.append({
                "action": f"Address missing data in {', '.join(cols_with_nulls[:2])} before model training",
                "priority": "High",
                "timeline": "1 week"
            })

        if numeric_cols:
            actions.append({
                "action": f"Standardize {numeric_cols[0]} and other numeric features with different scales",
                "priority": "Medium",
                "timeline": "3 days"
            })

        actions.append({
            "action": f"Deploy {ml.get('best_model', 'ensemble')} model with cross-validation monitoring",
            "priority": "High",
            "timeline": "2 weeks"
        })

        # Data-driven ROI projections based on data quality
        quality_factor = quality_score / 100
        roi_projection = {
            "conservative": f"+{round(5 + quality_factor * 5, 1)}%",
            "moderate": f"+{round(12 + quality_factor * 8, 1)}%",
            "optimistic": f"+{round(20 + quality_factor * 15, 1)}%"
        }

        # Build executive summary
        exec_summary = (
            f"Analysis of '{filename}' ({row_count:,} records, {len(columns)} columns) "
            f"reveals {len(insights)} key insights. "
            f"Data quality is {quality_score:.0f}/100. "
            f"Best performing model is {ml.get('best_model', 'ensemble')} with R²={ml.get('best_r2', 'N/A')}. "
            f"Top predictive feature is {max(feature_importance.items(), key=lambda x: x[1])[0] if feature_importance else 'N/A'}."
        )

        # Build key_findings
        key_findings = insights[:4] if insights else ["Analysis completed successfully"]

        # Build recommendations
        recommendations = []
        for action in actions[:3]:
            recommendations.append({
                "recommendation": action["action"],
                "priority": action["priority"],
                "timeline": action["timeline"],
                "expected_outcome": "Improved model performance and data reliability",
            })

        return {
            "executive_summary": exec_summary,
            "business_insights": insights[:4] if isinstance(insights, list) else [],
            "key_findings": key_findings if isinstance(key_findings, list) else [],
            "recommended_actions": actions[:3] if isinstance(actions, list) else [],
            "recommendations": recommendations if isinstance(recommendations, list) else [],
            "roi_projection": roi_projection,
            "business_impact": roi_projection,
            "risk_matrix": self._default_risks(column_stats),
            "_source": "template"
        }

    def _sanitize
