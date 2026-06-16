import logging
from typing import Dict, Any
from app.core.agents.base import BaseAgent
from datetime import datetime

logger = logging.getLogger(__name__)

class DesignerAgent(BaseAgent):
    """
    Designer Agent - Dynamically selects chart types based on
    actual data characteristics instead of hardcoded defaults.
    """

    async def execute(self) -> Dict[str, Any]:
        stats = self.board.get("statistics", {})
        ml = self.board.get("ml_results", {})
        strategy = self.board.get("strategy", {})
        data_quality = self.board.get("data_quality", {})
        dataset = self.board.get("dataset", {})

        columns = dataset.get("columns", [])
        schema = dataset.get("schema", {})
        column_stats = dataset.get("column_stats", {})

        logger.info(f"Designer selecting charts for {len(columns)} columns")

        # FIXED: Pass strategy to _select_charts_dynamically
        chart_specs = self._select_charts_dynamically(
            stats, ml, data_quality, columns, column_stats, schema, strategy
        )

        # Generate report sections based on actual analysis results
        report_sections = self._build_report_sections(
            data_quality, stats, ml, strategy
        )

        # Calculate quality based on chart variety and relevance
        chart_quality = min(70 + len(chart_specs) * 3 + len(set(c["type"] for c in chart_specs)) * 5, 97)

        result = {
            "quality_score": round(chart_quality, 1),
            "charts_generated": len(chart_specs),
            "chart_specs": chart_specs,
            "report_sections": report_sections,
            "dashboard_config": {
                "theme": "dark",
                "layout": self._determine_layout(len(chart_specs)),
                "widgets": len(chart_specs) + 2,
            },
            "report_generated": True,
            "generated_at": datetime.utcnow().isoformat(),
        }

        self.board.post("design", result)
        logger.info(f"Designer complete: {len(chart_specs)} charts, types={[c['type'] for c in chart_specs]}")
        return result

    def _select_charts_dynamically(
        self, stats: dict, ml: dict, data_quality: dict,
        columns: list, column_stats: dict, schema: dict, strategy: dict  # FIXED: Added strategy parameter
    ) -> list:
        """Select chart types based on actual data characteristics."""
        chart_specs = []

        # Identify column types
        numeric_cols = [c for c in columns if column_stats.get(c, {}).get("type") == "numeric"]
        cat_cols = [c for c in columns if column_stats.get(c, {}).get("type") == "categorical"]
        datetime_cols = [c for c in columns if column_stats.get(c, {}).get("type") == "datetime"]

        # 1. Correlation heatmap - only if we have 2+ numeric columns and correlations exist
        correlations = stats.get("correlations", [])
        if len(numeric_cols) >= 2 and correlations:
            chart_specs.append({
                "type": "correlation_heatmap",
                "title": f"Correlation Matrix ({len(numeric_cols)} numeric variables)",
                "data": correlations[:10],
                "relevance": "high" if stats.get("significant_correlations", 0) > 0 else "medium",
            })

        # 2. Feature importance - always include if available
        feature_importance = ml.get("feature_importance", {})
        if feature_importance:
            # Sort by importance
            sorted_features = dict(sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10])
            chart_specs.append({
                "type": "feature_importance",
                "title": "ML Feature Importance Rankings",
                "data": sorted_features,
                "relevance": "high",
            })

        # 3. Model comparison - always include if models evaluated
        models = ml.get("models_evaluated", [])
        if models:
            chart_specs.append({
                "type": "model_comparison",
                "title": "Model Performance Comparison",
                "data": models,
                "relevance": "high",
            })

        # 4. Data quality dashboard - if quality checks exist
        quality_checks = data_quality.get("quality_checks", {})
        if quality_checks:
            chart_specs.append({
                "type": "quality_gauge",
                "title": f"Data Quality Score: {data_quality.get('quality_score', 'N/A')}/100",
                "data": quality_checks,
                "relevance": "high",
            })

        # 5. Distribution plots for top numeric columns
        if numeric_cols:
            for col in numeric_cols[:2]:  # Top 2 numeric columns
                stat = column_stats.get(col, {})
                chart_specs.append({
                    "type": "histogram",
                    "title": f"Distribution of '{col}'",
                    "column": col,
                    "data": {
                        "column": col,
                        "mean": stat.get("mean"),
                        "std": stat.get("std"),
                        "min": stat.get("min"),
                        "max": stat.get("max"),
                        "null_pct": stat.get("null_pct"),
                    },
                    "relevance": "medium",
                })

        # 6. Bar chart for top categorical column
        if cat_cols:
            top_cat = cat_cols[0]
            stat = column_stats.get(top_cat, {})
            top_values = stat.get("top_values", {})
            if top_values:
                chart_specs.append({
                    "type": "bar_chart",
                    "title": f"Top Categories in '{top_cat}'",
                    "column": top_cat,
                    "data": dict(list(top_values.items())[:8]),
                    "relevance": "medium",
                })

        # 7. Missing values heatmap - if there are missing values
        missing_pct = data_quality.get("missing_values_pct", 0)
        if missing_pct > 0:
            null_columns = {
                col: stat.get("null_pct", 0)
                for col, stat in column_stats.items()
                if stat.get("null_pct", 0) > 0
            }
            if null_columns:
                chart_specs.append({
                    "type": "missing_values",
                    "title": f"Missing Values Overview ({missing_pct:.1f}% overall)",
                    "data": null_columns,
                    "relevance": "high" if missing_pct > 5 else "medium",
                })

        # 8. Time series - if datetime column exists
        if datetime_cols:
            chart_specs.append({
                "type": "time_series",
                "title": f"Timeline Analysis by '{datetime_cols[0]}'",
                "column": datetime_cols[0],
                "data": {"datetime_column": datetime_cols[0], "numeric_columns": numeric_cols[:3]},
                "relevance": "high",
            })

        # 9. ROI projection chart from strategy
        roi = strategy.get("roi_projection", {})
        if roi:
            chart_specs.append({
                "type": "roi_projection",
                "title": "ROI Projection Scenarios",
                "data": roi,
                "relevance": "medium",
            })

        # Sort by relevance and limit to top 8
        relevance_order = {"high": 0, "medium": 1, "low": 2}
        chart_specs.sort(key=lambda x: relevance_order.get(x.get("relevance", "medium"), 1))

        return chart_specs[:8]

    def _build_report_sections(self, data_quality: dict, stats: dict, ml: dict, strategy: dict) -> list:
        """Build report sections based on actual analysis results."""
        sections = ["Executive Summary"]

        if data_quality.get("quality_score"):
            sections.append("Data Quality Assessment")

        if stats.get("correlations"):
            sections.append("Statistical Analysis")

        if ml.get("models_evaluated"):
            sections.append("Machine Learning Results")

        if strategy.get("business_insights"):
            sections.append("Strategic Recommendations")

        if strategy.get("roi_projection"):
            sections.append("ROI Analysis")

        sections.append("Appendix")

        return sections

    def _determine_layout(self, num_charts: int) -> str:
        """Determine optimal dashboard layout based on chart count."""
        if num_charts <= 3:
            return "single_column"
        elif num_charts <= 6:
            return "grid"
        else:
            return "masonry"

    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        return {"theme": {"type": "string", "enum": ["dark", "light"]}}
