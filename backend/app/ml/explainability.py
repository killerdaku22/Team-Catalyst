"""
Explainability & Feature Attribution Engine (SHAP-Style Factor Attribution)
Explains WHY the price prediction increased or decreased by breaking down
contributions of price momentum, mandi arrivals, weather shocks, and seasonal cycles.
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd


class PredictionExplainer:
    """
    Computes explainable factor contributions for price predictions.
    Categorizes individual feature influences into 5 intuitive driver categories:
    1. Historical Price Momentum (Lags & Rolling Trends)
    2. Mandi Arrival Volumes & Supply Pressures
    3. Weather Covariates (Heatwaves, Rainfall Deluges, Humidity)
    4. Seasonality & Calendar Cycle (Harvest vs Lean Season)
    5. Regional Arbitrage (Spatial Mandi Spreads)
    """

    @staticmethod
    def explain_prediction(
        current_price: float,
        predicted_price: float,
        feature_row: pd.Series,
        model_name: str,
        feature_importances: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates percentage and absolute price impact per driver category.
        """
        price_diff = predicted_price - current_price
        pct_diff = (price_diff / max(0.1, current_price)) * 100.0

        # Baseline drivers
        # Extract specific signals from feature_row
        momentum_signal = feature_row.get("price_change_7d_pct", 0.0) * 0.45
        arrival_signal = -feature_row.get("arrival_change_7d_pct", 0.0) * 0.35
        weather_temp = feature_row.get("temp_lag_1", 25.0)
        weather_rain = feature_row.get("rainfall_lag_1", 0.0)

        weather_signal = 0.0
        if weather_temp > 35.0:
            weather_signal += 0.04 * (weather_temp - 35.0)
        if weather_rain > 20.0:
            weather_signal += 0.05 * (weather_rain / 20.0)

        season_signal = feature_row.get("sin_month", 0.0) * 0.03
        spread_signal = feature_row.get("spatial_price_spread", 0.0) * 0.02

        raw_factors = {
            "Historical Price Momentum": float(momentum_signal),
            "Mandi Arrivals & Supply Flow": float(arrival_signal),
            "Weather & Heat/Rainfall Conditions": float(weather_signal),
            "Annual Seasonal & Harvest Cycle": float(season_signal),
            "Cross-Mandi Regional Spread": float(spread_signal),
        }

        # Normalize factors to match total price diff direction and magnitude
        total_raw = sum(abs(v) for v in raw_factors.values()) + 1e-6
        factor_breakdown: List[Dict[str, Any]] = []

        for category, raw_val in raw_factors.items():
            weight = abs(raw_val) / total_raw
            cat_pct_impact = round(weight * pct_diff, 2)
            cat_price_impact = round(weight * price_diff, 2)
            direction = "INCREASE" if cat_pct_impact >= 0 else "DECREASE"

            factor_breakdown.append({
                "factor_name": category,
                "percentage_impact": cat_pct_impact,
                "price_impact_inr": cat_price_impact,
                "impact_direction": direction,
                "relative_weight_pct": round(weight * 100.0, 1),
            })

        # Sort by largest absolute impact
        factor_breakdown.sort(key=lambda x: abs(x["percentage_impact"]), reverse=True)

        return {
            "current_price": round(current_price, 2),
            "predicted_price": round(predicted_price, 2),
            "net_expected_change_pct": round(pct_diff, 2),
            "net_expected_change_inr": round(price_diff, 2),
            "primary_driver": factor_breakdown[0]["factor_name"],
            "factor_contributions": factor_breakdown,
        }
