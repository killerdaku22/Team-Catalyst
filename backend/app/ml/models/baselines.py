"""
Baseline Models for Price Forecasting
1. Naive Persistence: P(t+h) = P(t)
2. Rolling Moving Average: P(t+h) = Mean(P(t-k)...P(t))
"""

from typing import Optional
import numpy as np
import pandas as pd
from app.ml.models.base import BasePriceModel


class NaivePersistenceModel(BasePriceModel):
    """
    Level 1 Baseline: Naive Persistence Model.
    Predicts the future price as the most recent observed price P(t).
    Essential benchmark: any production ML model MUST outperform this.
    """

    def __init__(self):
        super().__init__(name="Naive Persistence")

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "NaivePersistenceModel":
        self.feature_names = list(X.columns)
        # Use price_lag_1 as persistence feature
        if "price_lag_1" in X.columns:
            preds = X["price_lag_1"].values
        else:
            preds = np.full(len(y), y.mean())
        self.train_residuals = y.values - preds
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if "price_lag_1" in X.columns:
            return X["price_lag_1"].values
        # Fallback to first available lag
        for col in X.columns:
            if "price" in col.lower() or "lag" in col.lower():
                return X[col].values
        return np.ones(len(X)) * 25.0


class MovingAverageModel(BasePriceModel):
    """
    Level 2 Baseline: Rolling Moving Average Model (e.g. 7-day, 14-day).
    Smooths short-term fluctuations.
    """

    def __init__(self, window: int = 7):
        super().__init__(name=f"Moving Average ({window}D)")
        self.window = window

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "MovingAverageModel":
        self.feature_names = list(X.columns)
        col = f"rolling_mean_{self.window}"
        if col in X.columns:
            preds = X[col].values
        elif "price_lag_1" in X.columns:
            preds = X["price_lag_1"].values
        else:
            preds = np.full(len(y), y.mean())
        self.train_residuals = y.values - preds
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        col = f"rolling_mean_{self.window}"
        if col in X.columns:
            return X[col].values
        if "price_lag_1" in X.columns:
            return X["price_lag_1"].values
        return np.ones(len(X)) * 25.0
