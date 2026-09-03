"""
Base Class for all Agricultural Price Forecasting Models
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd


class BasePriceModel(ABC):
    """Abstract base class establishing standard fit / predict / interval interfaces."""

    def __init__(self, name: str):
        self.name = name
        self.is_fitted: bool = False
        self.feature_names: list = []
        self.train_residuals: np.ndarray = np.array([])
        self.metadata: Dict[str, Any] = {}

    @abstractmethod
    def fit(self, X: pd.DataFrame, y: pd.Series) -> "BasePriceModel":
        """Fits model parameters on training features X and target y."""
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generates point predictions."""
        pass

    def predict_with_intervals(
        self, X: pd.DataFrame, confidence_level: float = 0.80
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculates point predictions with calibrated empirical prediction intervals:
        [prediction - z*sigma_res, prediction + z*sigma_res]
        """
        preds = self.predict(X)

        if len(self.train_residuals) > 5:
            # Empirical residual standard deviation
            sigma = float(np.std(self.train_residuals))
        else:
            sigma = float(np.mean(preds) * 0.08)  # default 8% uncertainty

        # Multiplier based on normal z-score approximation
        z = 1.282 if confidence_level <= 0.80 else 1.960
        margin = z * sigma

        lower = np.maximum(1.0, preds - margin)
        upper = preds + margin

        return preds, lower, upper
