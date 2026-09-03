"""
Data Pipeline & Quality Engine for Agricultural Market Intelligence
Handles raw data ingestion, schema validation, unit error correction,
domain boundary verification, IQR outlier detection, and data quality scorecard.
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd


class DataQualityEngine:
    """
    Ensures high fidelity of incoming Agmarknet market and weather datasets.
    """

    def __init__(self, iqr_multiplier: float = 2.5):
        self.iqr_multiplier = iqr_multiplier
        self.quality_stats: Dict[str, Any] = {
            "total_records_ingested": 0,
            "unit_errors_corrected": 0,
            "boundary_violations_fixed": 0,
            "missing_values_imputed": 0,
            "iqr_outliers_flagged": 0,
            "clean_records_count": 0,
            "overall_quality_score": 100.0,
        }

    def clean_and_validate(
        self, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Cleans the raw market dataset through a structured multi-stage pipeline:
        1. Deduplication & Schema check
        2. Unit Normalization (e.g. 100x Quintal vs Kg mismatch)
        3. Missing value imputation
        4. Domain boundary constraints (min <= modal <= max, non-negative)
        5. Statistical IQR Outlier Detection
        """
        if df.empty:
            return df, self.quality_stats

        clean_df = df.copy()
        initial_count = len(clean_df)
        self.quality_stats["total_records_ingested"] = initial_count

        # 1. Deduplicate by date, commodity, market
        if "date" in clean_df.columns and "commodity" in clean_df.columns and "market" in clean_df.columns:
            clean_df = clean_df.drop_duplicates(subset=["date", "commodity", "market"], keep="last")

        # Ensure date format
        clean_df["date"] = pd.to_datetime(clean_df["date"])
        clean_df = clean_df.sort_values(by=["commodity", "market", "date"]).reset_index(drop=True)

        # 2. Impute missing numeric values using group-wise rolling forward/backward fill
        numeric_cols = ["modal_price", "min_price", "max_price", "arrival_quantity", "temperature", "rainfall", "humidity"]
        for col in numeric_cols:
            if col in clean_df.columns:
                null_count = clean_df[col].isnull().sum()
                if null_count > 0:
                    self.quality_stats["missing_values_imputed"] += int(null_count)
                    clean_df[col] = (
                        clean_df.groupby(["commodity", "market"])[col]
                        .transform(lambda x: x.ffill().bfill().fillna(x.median() if not np.isnan(x.median()) else 25.0))
                    )

        # 3. Unit Error Correction (Detecting quintal prices e.g. ₹2800 instead of ₹28/kg)
        unit_errors = 0
        for (comm, market), group in clean_df.groupby(["commodity", "market"]):
            median_p = group["modal_price"].median()
            if median_p > 0:
                # If a price is > 15x median, it is likely entered in Rs/Quintal instead of Rs/Kg
                is_unit_err = clean_df.loc[group.index, "modal_price"] > (median_p * 15.0)
                unit_count = is_unit_err.sum()
                if unit_count > 0:
                    unit_errors += unit_count
                    clean_df.loc[group.index[is_unit_err], "modal_price"] /= 100.0
                    clean_df.loc[group.index[is_unit_err], "min_price"] /= 100.0
                    clean_df.loc[group.index[is_unit_err], "max_price"] /= 100.0
        self.quality_stats["unit_errors_corrected"] = int(unit_errors)

        # 4. Domain Boundary Validation (min_price <= modal_price <= max_price)
        boundary_fixes = 0
        # Fix min_price > modal_price
        inv_min = clean_df["min_price"] > clean_df["modal_price"]
        if inv_min.any():
            boundary_fixes += int(inv_min.sum())
            clean_df.loc[inv_min, "min_price"] = clean_df.loc[inv_min, "modal_price"] * 0.95

        # Fix max_price < modal_price
        inv_max = clean_df["max_price"] < clean_df["modal_price"]
        if inv_max.any():
            boundary_fixes += int(inv_max.sum())
            clean_df.loc[inv_max, "max_price"] = clean_df.loc[inv_max, "modal_price"] * 1.05

        # Ensure positive values
        neg_prices = clean_df["modal_price"] <= 0
        if neg_prices.any():
            boundary_fixes += int(neg_prices.sum())
            clean_df.loc[neg_prices, "modal_price"] = 5.0
            clean_df.loc[neg_prices, "min_price"] = 4.5
            clean_df.loc[neg_prices, "max_price"] = 5.5

        self.quality_stats["boundary_violations_fixed"] = int(boundary_fixes)

        # 5. Statistical IQR Outlier Detection (per commodity)
        clean_df["is_outlier"] = False
        outlier_flags = 0

        for comm, group in clean_df.groupby("commodity"):
            q1 = group["modal_price"].quantile(0.25)
            q3 = group["modal_price"].quantile(0.75)
            iqr = q3 - q1
            lower_bound = max(1.0, q1 - (self.iqr_multiplier * iqr))
            upper_bound = q3 + (self.iqr_multiplier * iqr)

            outlier_mask = (group["modal_price"] < lower_bound) | (group["modal_price"] > upper_bound)
            num_outliers = outlier_mask.sum()
            if num_outliers > 0:
                outlier_flags += num_outliers
                clean_df.loc[group.index[outlier_mask], "is_outlier"] = True

                # Cap / Winsorize extreme non-physical outliers for downstream ML stability
                clean_df.loc[group.index[outlier_mask], "modal_price"] = clean_df.loc[
                    group.index[outlier_mask], "modal_price"
                ].clip(lower=lower_bound * 0.8, upper=upper_bound * 1.2)

        self.quality_stats["iqr_outliers_flagged"] = int(outlier_flags)
        self.quality_stats["clean_records_count"] = len(clean_df)

        # Calculate overall quality score (0 - 100%)
        total_issues = (
            self.quality_stats["unit_errors_corrected"]
            + self.quality_stats["boundary_violations_fixed"]
            + self.quality_stats["missing_values_imputed"]
            + self.quality_stats["iqr_outliers_flagged"]
        )
        anomaly_rate = total_issues / max(1, initial_count)
        self.quality_stats["anomaly_rate_pct"] = round(anomaly_rate * 100.0, 2)
        self.quality_stats["overall_quality_score"] = round(max(50.0, 100.0 - (anomaly_rate * 150.0)), 1)

        return clean_df, self.quality_stats


def load_and_preprocess_dataset(filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Loads CSV dataset and executes the Data Quality Engine."""
    df = pd.read_csv(filepath)
    engine = DataQualityEngine()
    clean_df, stats = engine.clean_and_validate(df)
    return clean_df, stats
