"""
Ablation Experimentation Engine
Measures empirical incremental value added by each feature category:
Feature Set A: Historical Price Only
Feature Set B: Price + Mandi Arrivals
Feature Set C: Price + Arrivals + Weather
Feature Set D: Price + Arrivals + Weather + Cross-Mandi Spreads
Feature Set E: Full Multi-Model Ensemble
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np

from app.ml.models.gradient_boosting import GradientBoostedTreeModel
from app.ml.evaluation.metrics import ForecastEvaluator


class FeatureAblationStudy:
    """
    Evaluates empirical MAE and RMSE improvements gained from adding external feature modalities.
    """

    @staticmethod
    def run_ablation(
        df_featured: pd.DataFrame,
        commodity: str,
        market: str,
        target_horizon: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Executes ablation study across 5 structured feature groups.
        """
        sub_df = df_featured[
            (df_featured["commodity"] == commodity) & (df_featured["market"] == market)
        ].sort_values("date").reset_index(drop=True)

        target_col = f"target_price_{target_horizon}d"
        valid_df = sub_df[sub_df[target_col].notnull()].reset_index(drop=True)

        if len(valid_df) < 50:
            return []

        # Split into train & test (80/20 temporal split)
        split_idx = int(len(valid_df) * 0.8)
        train_df = valid_df.iloc[:split_idx]
        test_df = valid_df.iloc[split_idx:]

        y_train = train_df[target_col]
        y_test = test_df[target_col].values
        baseline_prices = test_df["price_lag_1"].values if "price_lag_1" in test_df.columns else test_df["modal_price"].values

        # Define feature tiers
        price_cols = [c for c in valid_df.columns if "price_lag" in c or "rolling_mean" in c or "rolling_std" in c or "volatility" in c]
        arrival_cols = [c for c in valid_df.columns if "arrival" in c]
        weather_cols = [c for c in valid_df.columns if "temp" in c or "rainfall" in c or "humidity" in c or "heatwave" in c or "heavy_rain" in c]
        spatial_cols = [c for c in valid_df.columns if "spatial" in c or "benchmark" in c or "sin_" in c or "cos_" in c or "month" in c]

        feature_groups = [
            ("Historical Price Only", price_cols),
            ("+ Mandi Arrivals", price_cols + arrival_cols),
            ("+ Weather Covariates", price_cols + arrival_cols + weather_cols),
            ("+ Cross-Mandi Spreads & Seasonality", price_cols + arrival_cols + weather_cols + spatial_cols),
        ]

        results: List[Dict[str, Any]] = []

        for name, cols in feature_groups:
            # Train GBR on subset of features
            available_cols = [c for c in cols if c in valid_df.columns]
            if not available_cols:
                continue

            X_train = train_df[available_cols]
            X_test = test_df[available_cols]

            model = GradientBoostedTreeModel(n_estimators=60, max_depth=3)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            metrics = ForecastEvaluator.evaluate_all(y_test, preds, baseline_prices)
            results.append({
                "feature_set": name,
                "features_count": len(available_cols),
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "smape": metrics["smape"],
                "directional_accuracy": metrics["directional_accuracy"],
            })

        return results
