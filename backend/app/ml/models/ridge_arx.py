"""
Level 4 Model: Ridge Auto-Regressive with Exogenous Features (Ridge ARX)
Combines auto-regressive lags with weather and arrival covariates using L2 regularized regression.
"""

from typing import Optional, Dict
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from app.ml.models.base import BasePriceModel


class RidgeARXModel(BasePriceModel):
    """
    Ridge Auto-Regressive Exogenous Model.
    Learns linear elasticities between historical prices, weather (temp, rain, humidity),
    and mandi arrival quantities with L2 weight shrinkage to prevent overfitting.
    """

    def __init__(self, alpha: float = 10.0):
        super().__init__(name="Ridge ARX (Weather + Arrivals)")
        self.alpha = alpha
        self.scaler = StandardScaler()
        self.model = Ridge(alpha=self.alpha, fit_intercept=True)
        self.feature_coefficients: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "RidgeARXModel":
        self.feature_names = list(X.columns)
        X_clean = X.fillna(0.0)
        X_scaled = self.scaler.fit_transform(X_clean)

        self.model.fit(X_scaled, y)
        preds = self.model.predict(X_scaled)
        self.train_residuals = y.values - preds
        self.is_fitted = True

        # Store feature coefficients for explainability
        for name, coef in zip(self.feature_names, self.model.coef_):
            self.feature_coefficients[name] = float(coef)

        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted yet.")
        X_clean = X[self.feature_names].fillna(0.0)
        X_scaled = self.scaler.transform(X_clean)
        preds = self.model.predict(X_scaled)
        return np.maximum(1.0, preds)
