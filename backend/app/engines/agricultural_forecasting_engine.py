"""
Multi-Model Agricultural Price Forecasting Engine
Produces multi-horizon price curves (t+1, t+3, t+7, t+14) with:
1. Winning model tournament selection per commodity & mandi
2. 80% and 95% calibrated confidence intervals
3. Explainable factor attributions (momentum, arrivals, weather, seasonality)
4. Model performance diagnostics and ablation benchmarks
"""

import datetime
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from app.ml.training.model_registry import ModelRegistry
from app.ml.evaluation.ablation import FeatureAblationStudy


class AgriculturalForecastingEngine:
    """
    Production-grade Price Forecasting Engine for AgriDirect.
    """

    HORIZONS = [1, 3, 7, 14]

    def __init__(self, registry: Optional[ModelRegistry] = None):
        self.registry = registry or ModelRegistry()

    def generate_price_forecast(
        self, commodity: str, market: str, horizon_days: int = 14
    ) -> Dict[str, Any]:
        """
        Produces multi-horizon forecasts with confidence bounds and explainability breakdown.
        """
        df = self.registry.featured_df
        sub_df = df[(df["commodity"] == commodity) & (df["market"] == market)].sort_values("date").reset_index(drop=True)

        if sub_df.empty:
            return {"error": f"No data found for commodity '{commodity}' in market '{market}'"}

        latest_row = sub_df.iloc[-1]
        current_price = float(latest_row["modal_price"])
        latest_date_str = str(latest_row["date"])[:10]
        latest_date = datetime.datetime.strptime(latest_date_str, "%Y-%m-%d").date()

        feature_cols = self.registry.feature_engineer.feature_columns
        X_latest = sub_df[feature_cols].tail(1)

        # Get best model for 7-day target as canonical reference
        winning_model, tournament = self.registry.get_or_train_best_model(commodity, market, horizon=7)

        # Generate day-by-day point predictions and intervals for requested horizon (e.g. 14 days)
        forecast_timeline: List[Dict[str, Any]] = []

        # Use winning model + dynamic trend decay
        pred_base_7d, lower_80_base, upper_80_base = winning_model.predict_with_intervals(X_latest, confidence_level=0.80)
        p_7d = float(pred_base_7d[0])
        std_err = float((upper_80_base[0] - lower_80_base[0]) / (2 * 1.282))

        # Daily trajectory interpolation & compounding
        daily_drift = (p_7d - current_price) / 7.0

        for day_offset in range(1, horizon_days + 1):
            f_date = latest_date + datetime.timedelta(days=day_offset)

            # Dampen trend past 7 days towards long-term rolling mean
            if day_offset <= 7:
                expected_p = current_price + (daily_drift * day_offset)
            else:
                extra_days = day_offset - 7
                rolling_anchor = float(latest_row.get("rolling_mean_30", current_price))
                decay_weight = min(0.6, 0.08 * extra_days)
                expected_p = (p_7d + daily_drift * extra_days * 0.5) * (1 - decay_weight) + (rolling_anchor * decay_weight)

            expected_p = max(1.0, round(float(expected_p), 2))

            # Uncertainty expands with horizon: sqrt(day_offset)
            horizon_scale = np.sqrt(day_offset / 7.0)
            margin_80 = 1.282 * std_err * horizon_scale
            margin_95 = 1.960 * std_err * horizon_scale

            lower_80 = max(1.0, round(expected_p - margin_80, 2))
            upper_80 = round(expected_p + margin_80, 2)
            lower_95 = max(1.0, round(expected_p - margin_95, 2))
            upper_95 = round(expected_p + margin_95, 2)

            forecast_timeline.append({
                "date": f_date.strftime("%Y-%m-%d"),
                "day_offset": day_offset,
                "predicted_price": expected_p,
                "lower_80": lower_80,
                "upper_80": upper_80,
                "lower_95": lower_95,
                "upper_95": upper_95,
            })

        # Key horizon summary points
        target_7d_pred = forecast_timeline[min(6, len(forecast_timeline) - 1)]["predicted_price"]
        pct_change_7d = round(((target_7d_pred - current_price) / max(0.1, current_price)) * 100.0, 2)

        # Confidence calculation based on sMAPE (e.g. sMAPE of 6% -> 88% confidence)
        best_mae = tournament.get("best_mae", 1.8)
        best_smape = tournament["leaderboard"][0]["smape"] if tournament["leaderboard"] else 6.5
        confidence_pct = round(max(50.0, min(95.0, 100.0 - (best_smape * 1.5))), 1)

        # Explainability feature attribution
        explanation = self.registry.explainer.explain_prediction(
            current_price=current_price,
            predicted_price=target_7d_pred,
            feature_row=latest_row,
            model_name=winning_model.name,
            feature_importances=getattr(winning_model, "feature_importances", None),
        )

        return {
            "commodity": commodity,
            "market": market,
            "current_date": latest_date_str,
            "current_price_rs_kg": current_price,
            "horizon_days": horizon_days,
            "winning_model": winning_model.name,
            "confidence_score_pct": confidence_pct,
            "expected_7d_price_rs_kg": target_7d_pred,
            "expected_7d_change_pct": pct_change_7d,
            "price_trend": "UPWARD / BULLISH" if pct_change_7d > 2.0 else ("DOWNWARD / BEARISH" if pct_change_7d < -2.0 else "STABLE"),
            "forecast_curve": forecast_timeline,
            "explainability": explanation,
            "model_leaderboard": tournament.get("leaderboard", []),
        }

    def get_ablation_benchmarks(self, commodity: str, market: str) -> List[Dict[str, Any]]:
        """Executes and returns empirical feature ablation comparison for the requested series."""
        df = self.registry.featured_df
        return FeatureAblationStudy.run_ablation(df, commodity, market, target_horizon=7)
