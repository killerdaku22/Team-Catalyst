"""
Level 5 Model: Gradient Boosted Trees Regressor
Captures non-linear feature interactions, non-monotonic weather thresholds (e.g. heatwaves),
and complex supply elasticity.
"""

from typing import Optional, Dict
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from app.ml.models.base import BasePriceModel


class GradientBoostedTreeModel(BasePriceModel):
    """
    Gradient Boosted Trees Model for Agricultural Price Prediction.
    Captures non-linear thresholds (e.g. temperature > 38C spoilage cliff, rainfall > 35mm transport block).
    Provides tree-based feature importance breakdown.
    """

    def __init__(
        self,
        n_estimators: int = 100,
        learning_rate: float = 0.05,
        max_depth: int = 4,
        subsample: float = 0.85,
        random_state: int = 42,
    ):
        super().__init__(name="Gradient Boosted Trees (XGBoost/GBR)")
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.subsample = subsample
        self.random_state = random_state

        self.model = GradientBoostingRegressor(
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            subsample=self.subsample,
            random_state=self.random_state,
            loss="squared_error",
        )
        self.feature_importances: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "GradientBoostedTreeModel":
        self.feature_names = list(X.columns)
        X_clean = X.fillna(0.0)

        self.model.fit(X_clean, y)
        preds = self.model.predict(X_clean)
        self.train_residuals = y.values - preds
        self.is_fitted = True

        # Extract normalized feature importances
        raw_importances = self.model.feature_importances_
        for name, imp in zip(self.feature_names, raw_importances):
            self.feature_importances[name] = round(float(imp), 4)

        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted yet.")
        X_clean = X[self.feature_names].fillna(0.0)
        preds = self.model.predict(X_clean)
        return np.maximum(1.0, preds)
