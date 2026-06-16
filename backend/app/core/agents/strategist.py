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

        # FIXED: Try LLM with much richer real data context
        groq_insights = None
        try:
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

            prompt = f"""You are a senior business strategist analyzing data analytics results.

DATASET PROFILE:
- File: {filename}
- Records: {row_count:,}
- Columns: {len(columns)} ({', '.join(columns[:10])}{'...' if len(columns) > 10 else ''})
- Quality Score: {data_quality.get('quality_score', 'N/A')}/100

COLUMN DETAILS:
{chr(10).join(column_summary)}

STATISTICAL FINDINGS:
- Correlations analyzed: {len(stats.get('correlations', []))}
- Significant correlations: {stats.get('significant_correlations', 0)}
{chr(10).join(correlations_summary) if correlations_summary else 'No strong correlations detected'}

ML MODEL RESULTS:
- Best model: {ml.get('best_model', 'N/A')} (R²={ml.get('best_r2', 'N/A')})
- Top features by importance: {', '.join([f'{k}={v}' for k, v in top_features])}
- Data quality score: {ml.get('data_profile', {}).get('data_quality_score', 'N/A')}

BUSINESS QUESTION CONTEXT: Analyze this dataset for actionable business insights.

Respond with ONLY valid JSON (no markdown, no explanation):
{{
  "business_insights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "recommended_actions": [
    {{"action": "string", "priority": "High|Medium|Low", "timeline": "string"}},
    {{"action": "string", "priority": "High|Medium|Low", "timeline": "string"}},
    {{"action": "string", "priority": "High|Medium|Low", "timeline": "string"}}
  ],
  "roi_projection": {{"conservative": "+X%", "moderate": "+Y%", "optimistic": "+Z%"}},
  "risk_matrix": [
    {{"risk": "string", "likelihood": "High|Medium|Low", "impact": "High|Medium|Low"}}
  ]
}}"""
            groq_insights = await call_groq(prompt, max_tokens=1200)
            if groq_insights and isinstance(groq_insights, dict):
                logger.info("Strategist received LLM-powered insights")
            else:
                logger.warning("LLM returned invalid format, using fallback")
        except Exception as e:
            logger.warning(f"Groq call failed, using template-based insights: {e}")

        # FIXED: Generate data-driven fallback insights that reference actual columns
        if not groq_insights or not isinstance(groq_insights, dict):
            groq_insights = self._generate_data_driven_insights(
                columns, column_stats, schema, stats, ml, row_count, filename
            )

        # Build final result with LLM or data-driven insights
        business_insights = groq_insights.get("business_insights", [])
        recommended_actions = groq_insights.get("recommended_actions", [])
        roi_projection = groq_insights.get("roi_projection", {})
        risk_matrix = groq_insights.get("risk_matrix", [])

        # Validate and sanitize ROI values
        roi_projection = self._sanitize_roi(roi_projection)

        result = {
            "quality_score": round(min(75 + len(business_insights) * 3 + len(recommended_actions) * 2, 96), 1),
            "llm_powered": groq_insights is not None and "template" not in str(groq_insights.get("_source", "")),
            "business_insights": business_insights,
            "roi_projection": roi_projection,
            "risk_matrix": risk_matrix if risk_matrix else self._default_risks(column_stats),
            "recommended_actions": recommended_actions,
            "scenario_simulations": self._calculate_scenarios(roi_projection),
        }

        self.board.post("strategy", result)
        logger.info(f"Strategist complete: {len(business_insights)} insights, LLM={result['llm_powered']}")
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

        return {
            "business_insights": insights[:4],
            "recommended_actions": actions[:3],
            "roi_projection": roi_projection,
            "risk_matrix": self._default_risks(column_stats),
            "_source": "template"  # marker for tracking
        }

    def _sanitize_roi(self, roi: dict) -> dict:
        """Ensure ROI values are properly formatted strings."""
        if not roi:
            return {
                "conservative": "+8%",
                "moderate": "+15%",
                "optimistic": "+25%"
            }
        sanitized = {}
        for key in ["conservative", "moderate", "optimistic"]:
            val = roi.get(key, "")
            if isinstance(val, (int, float)):
                sanitized[key] = f"+{val}%"
            elif isinstance(val, str):
                # Ensure starts with + and ends with %
                val = val.strip()
                if not val.startswith(("+", "-")):
                    val = "+" + val
                if not val.endswith("%"):
                    val = val + "%"
                sanitized[key] = val
            else:
                defaults = {"conservative": "+8%", "moderate": "+15%", "optimistic": "+25%"}
                sanitized[key] = defaults.get(key, "+10%")
        return sanitized

    def _default_risks(self, column_stats: dict) -> list:
        """Generate contextual risks based on data characteristics."""
        risks = []

        # Check for high null rates
        high_null = any(
            stat.get("null_pct", 0) > 10
            for stat in column_stats.values()
        )
        if high_null:
            risks.append({
                "risk": "Data quality issues from missing values",
                "likelihood": "High",
                "impact": "High"
            })

        risks.append({
            "risk": "Model performance degradation on unseen data distributions",
            "likelihood": "Medium",
            "impact": "High"
        })

        # Check for potential data leakage (columns with 100% uniqueness)
        id_cols = [
            col for col, stat in column_stats.items()
            if stat.get("unique_count", 0) > 0 and stat.get("unique_count") == stat.get("row_count", 0)
        ]
        if id_cols:
            risks.append({
                "risk": f"Potential data leakage from ID-like columns ({', '.join(id_cols[:2])})",
                "likelihood": "High" if len(id_cols) > 0 else "Medium",
                "impact": "High"
            })

        risks.append({
            "risk": "Feature drift in production deployment",
            "likelihood": "Medium",
            "impact": "Medium"
        })

        return risks

    def _calculate_scenarios(self, roi: dict) -> dict:
        """Calculate scenario multipliers from ROI percentages."""
        try:
            moderate_str = roi.get("moderate", "+15%").replace("%", "").replace("+", "")
            moderate_val = float(moderate_str) / 100
            return {
                "best_case": round(1 + moderate_val * 1.5, 2),
                "base_case": round(1 + moderate_val, 2),
                "worst_case": round(1 + moderate_val * 0.3, 2),
            }
        except (ValueError, TypeError):
            return {
                "best_case": 1.3,
                "base_case": 1.15,
                "worst_case": 1.05,
            }

    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        return {"industry": {"type": "string", "default": "general"}}
