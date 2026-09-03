"""
Level 3 Model: Holt-Winters Exponential Smoothing
Implements Level + Trend + Seasonality exponential smoothing.
"""

from typing import Optional
import numpy as np
import pandas as pd
from app.ml.models.base import BasePriceModel


class HoltWintersSmoothingModel(BasePriceModel):
    """
    Holt-Winters Exponential Smoothing model.
    Captures baseline level, linear/damped trend, and weekly/monthly seasonality.
    """

    def __init__(self, alpha: float = 0.35, beta: float = 0.15, gamma: float = 0.20, season_len: int = 7):
        super().__init__(name="Holt-Winters Smoothing")
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.season_len = season_len

        self.last_level: float = 25.0
        self.last_trend: float = 0.0
        self.seasonal_factors: np.ndarray = np.ones(season_len)

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "HoltWintersSmoothingModel":
        self.feature_names = list(X.columns)
        prices = y.values
        n = len(prices)

        if n < self.season_len * 2:
            self.last_level = float(np.mean(prices)) if n > 0 else 25.0
            self.last_trend = 0.0
            self.train_residuals = prices - self.last_level
            self.is_fitted = True
            return self

        # Initialize level and trend
        level = float(prices[0])
        trend = float(np.mean(prices[self.season_len : self.season_len * 2] - prices[: self.season_len]) / self.season_len)
        seasonals = np.ones(self.season_len)

        # Estimate initial seasonal components
        season_averages = [np.mean(prices[i : i + self.season_len]) for i in range(0, n - self.season_len + 1, self.season_len)]
        for i in range(self.season_len):
            season_vals = [prices[j * self.season_len + i] / max(0.1, season_averages[j]) for j in range(len(season_averages))]
            seasonals[i] = np.mean(season_vals) if season_vals else 1.0

        fitted_values = np.zeros(n)

        # Sequential filtering
        for t in range(n):
            s_idx = t % self.season_len
            val = prices[t]

            # 1-step ahead in-sample forecast
            forecast = (level + trend) * seasonals[s_idx]
            fitted_values[t] = forecast

            # Update equations
            new_level = self.alpha * (val / max(0.01, seasonals[s_idx])) + (1 - self.alpha) * (level + trend)
            new_trend = self.beta * (new_level - level) + (1 - self.beta) * trend
            new_seasonal = self.gamma * (val / max(0.01, new_level)) + (1 - self.gamma) * seasonals[s_idx]

            level = new_level
            trend = new_trend
            seasonals[s_idx] = new_seasonal

        self.last_level = level
        self.last_trend = trend
        self.seasonal_factors = seasonals
        self.train_residuals = prices - fitted_values
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        n = len(X)
        preds = np.zeros(n)

        # If day_of_week is available in X, use it to align seasonal indices
        for i in range(n):
            if "day_of_week" in X.columns:
                dow = int(X["day_of_week"].iloc[i]) % self.season_len
            else:
                dow = i % self.season_len

            # In dynamic setting, price_lag_1 provides updated local level anchor
            if "price_lag_1" in X.columns and not np.isnan(X["price_lag_1"].iloc[i]):
                local_anchor = float(X["price_lag_1"].iloc[i])
                preds[i] = (local_anchor + self.last_trend) * self.seasonal_factors[dow]
            else:
                preds[i] = (self.last_level + (i + 1) * self.last_trend) * self.seasonal_factors[dow]

        return np.maximum(1.0, preds)
