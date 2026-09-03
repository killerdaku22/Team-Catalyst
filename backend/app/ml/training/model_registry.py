"""
Model Registry & Pipeline Manager
Stores trained models, handles model lifecycles, runs automated periodic retraining,
and provides unified prediction interfaces for FastAPI endpoints.
"""

import os
from typing import Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

from app.ml.data_pipeline import DataQualityEngine
from app.ml.feature_engineering import AgriculturalFeatureEngineer
from app.ml.models.baselines import NaivePersistenceModel, MovingAverageModel
from app.ml.models.holt_winters import HoltWintersSmoothingModel
from app.ml.models.ridge_arx import RidgeARXModel
from app.ml.models.gradient_boosting import GradientBoostedTreeModel
from app.ml.training.walk_forward import WalkForwardValidator
from app.ml.explainability import PredictionExplainer


class ModelRegistry:
    """
    Central registry for trained agricultural ML models, feature pipelines,
    and walk-forward tournament scorecards.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, dataset_path: Optional[str] = None):
        if self._initialized:
            return

        candidates = [
            dataset_path,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/agmarknet_historical_prices.csv")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../dataset/agmarknet_historical_prices.csv")),
            os.path.abspath("data/agmarknet_historical_prices.csv"),
            os.path.abspath("backend/data/agmarknet_historical_prices.csv"),
            os.path.abspath("dataset/agmarknet_historical_prices.csv"),
        ]
        self.dataset_path = next((p for p in candidates if p and os.path.exists(p)), candidates[1])
        self.quality_engine = DataQualityEngine()
        self.feature_engineer = AgriculturalFeatureEngineer()
        self.walk_forward_validator = WalkForwardValidator()
        self.explainer = PredictionExplainer()

        self.raw_df: pd.DataFrame = pd.DataFrame()
        self.clean_df: pd.DataFrame = pd.DataFrame()
        self.featured_df: pd.DataFrame = pd.DataFrame()
        self.quality_stats: Dict[str, Any] = {}

        # Cache: (commodity, market, horizon) -> {model_name, model_obj, metrics}
        self.trained_models: Dict[Tuple[str, str, int], Any] = {}
        self.tournament_cache: Dict[Tuple[str, str, int], Dict[str, Any]] = {}

        self.load_and_train_pipeline()
        self._initialized = True

    def load_and_train_pipeline(self):
        """Loads data, applies cleaning, constructs features, and initializes registry."""
        if not os.path.exists(self.dataset_path):
            from app.ml.dataset_generator import save_default_datasets
            dataset_dir = os.path.dirname(self.dataset_path)
            self.raw_df = save_default_datasets(dataset_dir)
        else:
            self.raw_df = pd.read_csv(self.dataset_path)

        # 1. Clean & Validate
        self.clean_df, self.quality_stats = self.quality_engine.clean_and_validate(self.raw_df)

        # 2. Feature Engineering
        self.featured_df = self.feature_engineer.transform(self.clean_df)

    def get_or_train_best_model(
        self, commodity: str, market: str, horizon: int = 7
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Retrieves or trains the best model for a given commodity, market, and forecast horizon.
        """
        cache_key = (commodity, market, horizon)

        if cache_key in self.trained_models and cache_key in self.tournament_cache:
            return self.trained_models[cache_key], self.tournament_cache[cache_key]

        # Run walk-forward tournament
        tournament = self.walk_forward_validator.evaluate_commodity_market(
            self.featured_df, commodity, market, target_horizon=horizon
        )
        self.tournament_cache[cache_key] = tournament

        # Train winning model on all available historical data
        sub_df = self.featured_df[
            (self.featured_df["commodity"] == commodity) & (self.featured_df["market"] == market)
        ].sort_values("date").reset_index(drop=True)

        target_col = f"target_price_{horizon}d"
        feature_cols = self.feature_engineer.feature_columns

        valid_df = sub_df[sub_df[target_col].notnull()].reset_index(drop=True)

        best_name = tournament.get("best_model", "Gradient Boosted Trees")

        if "Gradient" in best_name:
            model = GradientBoostedTreeModel(n_estimators=80, max_depth=3)
        elif "Ridge" in best_name:
            model = RidgeARXModel(alpha=10.0)
        elif "Holt" in best_name:
            model = HoltWintersSmoothingModel(season_len=7)
        elif "Moving" in best_name:
            model = MovingAverageModel(window=7)
        else:
            model = NaivePersistenceModel()

        if not valid_df.empty:
            X = valid_df[feature_cols]
            y = valid_df[target_col]
            model.fit(X, y)
        else:
            # Fallback fit
            X = sub_df[feature_cols]
            y = sub_df["modal_price"]
            model.fit(X, y)

        self.trained_models[cache_key] = model
        return model, tournament
