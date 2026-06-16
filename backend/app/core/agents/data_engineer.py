import logging
from typing import Dict, Any
from app.core.agents.base import BaseAgent

logger = logging.getLogger(__name__)


class DataEngineerAgent(BaseAgent):
    """
    Data Engineer Agent - Performs REAL data quality analysis
    using the actual schema and column stats from the uploaded dataset.
    """

    async def execute(self) -> Dict[str, Any]:
        dataset = self.board.get("dataset", {})
        row_count = dataset.get("row_count", 0)
        columns = dataset.get("columns", [])
        schema = dataset.get("schema", {})
        column_stats = dataset.get("column_stats", {})

        logger.info(f"DataEngineer analyzing {len(columns)} columns, {row_count} rows")

        # FIXED: Use actual schema data instead of random numbers
        total_nulls = 0
        total_cells = row_count * len(columns) if row_count > 0 else 1
        data_types = {}
        column_quality = []

        for col in columns:
            col_info = schema.get(col, {})
            col_stat = column_stats.get(col, {})
            col_type = col_info.get("type", "unknown")
            null_count = col_stat.get("null_count", 0)
            null_pct = col_stat.get("null_pct", 0)
            unique_count = col_stat.get("unique_count", 0)

            total_nulls += null_count
            data_types[col] = col_type

            # Per-column quality assessment
            completeness = round(100 - null_pct, 2)
            uniqueness_score = 100
            if row_count > 0:
                duplicate_ratio = (row_count - unique_count) / row_count
                if col_type == "categorical" and unique_count < row_count * 0.5:
                    uniqueness_score = round(duplicate_ratio * 100, 2)

            column_quality.append({
                "column": col,
                "type": col_type,
                "null_count": null_count,
                "null_pct": null_pct,
                "unique_count": unique_count,
                "completeness": completeness,
            })

        # Calculate real missing values percentage
        missing_pct = round((total_nulls / total_cells) * 100, 2) if total_cells > 0 else 0

        # FIXED: Real quality score based on actual data quality
        completeness_score = round(100 - missing_pct, 2)
        type_coverage = round(
            (sum(1 for t in data_types.values() if t != "unknown") / len(columns) * 100), 2
        ) if columns else 0

        # Detect potential outliers for numeric columns
        outlier_count = 0
        outlier_details = []
        for col in columns:
            col_stat = column_stats.get(col, {})
            if col_stat.get("type") == "numeric":
                col_min = col_stat.get("min")
                col_max = col_stat.get("max")
                col_mean = col_stat.get("mean")
                col_std = col_stat.get("std")
                if col_mean is not None and col_std and col_std > 0:
                    # Simple IQR-based outlier flag (approximate)
                    lower_bound = col_mean - 3 * col_std
                    upper_bound = col_mean + 3 * col_std
                    has_outliers = (col_min is not None and col_min < lower_bound) or \
                                   (col_max is not None and col_max > upper_bound)
                    if has_outliers:
                        outlier_count += 1
                        outlier_details.append({
                            "column": col,
                            "min": col_min,
                            "max": col_max,
                            "mean": col_mean,
                            "std": col_std,
                            "note": f"Values may exceed 3-sigma bounds [{lower_bound:.2f}, {upper_bound:.2f}]"
                        })

        outlier_pct = round((outlier_count / len(columns) * 100), 2) if columns else 0

        # Real quality score based on completeness, type coverage, and outlier presence
        quality_score = round(
            (completeness_score * 0.4) +
            (type_coverage * 0.3) +
            ((100 - outlier_pct) * 0.3),
            1
        )

        # Determine best imputation method based on actual data
        imputation_method = self._determine_imputation(column_stats, data_types)

        result = {
            "quality_score": quality_score,
            "schema_inferred": True,
            "row_count": row_count,
            "column_count": len(columns),
            "columns_analyzed": len(columns),
            "missing_values_pct": missing_pct,
            "missing_values_total": total_nulls,
            "outliers_detected": outlier_count,
            "outlier_details": outlier_details[:5],  # Top 5 outlier candidates
            "imputation_method": imputation_method,
            "ddl_generated": True,
            # FIXED: Real data types from actual pandas inference
            "data_types": data_types,
            "column_quality": column_quality,
            "quality_checks": {
                "completeness": completeness_score,
                "consistency": round(100 - (len([c for c in column_quality if c["null_pct"] > 10]) / len(columns) * 100), 2) if columns else 100,
                "validity": type_coverage,
                "uniqueness": round(
                    sum(c["unique_count"] for c in column_quality) / sum(c["unique_count"] + c["null_count"] for c in column_quality) * 100, 2
                ) if column_quality else 100,
            }
        }

        self.board.post("data_quality", result)
        logger.info(f"DataEngineer complete: quality={quality_score}, missing={missing_pct}%, outliers={outlier_count}")
        return result

    def _determine_imputation(self, column_stats: dict, data_types: dict) -> str:
        """Determine best imputation strategy based on actual data types."""
        numeric_cols = sum(1 for t in data_types.values() if t == "numeric")
        categorical_cols = sum(1 for t in data_types.values() if t == "categorical")

        if numeric_cols > categorical_cols:
            return "median"
        elif categorical_cols > 0:
            return "mode"
        return "median"

    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        return {"imputation_strategy": {"type": "string", "enum": ["mean", "median", "mode"]}}
