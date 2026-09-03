# === backend/tests/test_models.py ===
"""
Tests for all 5 Agricultural Price Forecasting Models
"""

import pandas as pd
import numpy as np
import pytest

from app.ml.models.baselines import NaivePersistenceModel, MovingAverageModel
from app.ml.models.holt_winters import HoltWintersSmoothingModel
from app.ml.models.ridge_arx import RidgeARXModel
from app.ml.models.gradient_boosting import GradientBoostedTreeModel


@pytest.fixture
def dummy_train_data():
    np.random.seed(42)
    n = 100
    prices = np.cumsum(np.random.normal(0.1, 1.0, n)) + 30.0
    X = pd.DataFrame({
        "price_lag_1": np.roll(prices, 1),
        "price_lag_2": np.roll(prices, 2),
        "price_lag_7": np.roll(prices, 7),
        "rolling_mean_7": prices * 0.98,
        "rolling_std_7": np.ones(n) * 1.5,
        "temp_lag_1": np.random.uniform(22.0, 32.0, n),
        "rainfall_lag_1": np.random.uniform(0.0, 10.0, n),
        "day_of_week": np.arange(n) % 7,
    })
    y = pd.Series(prices)
    return X, y


def test_naive_persistence_model(dummy_train_data):
    X, y = dummy_train_data
    model = NaivePersistenceModel()
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds == X["price_lag_1"].values)


def test_moving_average_model(dummy_train_data):
    X, y = dummy_train_data
    model = MovingAverageModel(window=7)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds == X["rolling_mean_7"].values)


def test_holt_winters_model(dummy_train_data):
    X, y = dummy_train_data
    model = HoltWintersSmoothingModel(season_len=7)
    model.fit(X, y)
    preds, lower, upper = model.predict_with_intervals(X, confidence_level=0.80)
    assert len(preds) == len(X)
    assert np.all(lower <= preds)
    assert np.all(preds <= upper)


def test_ridge_arx_model(dummy_train_data):
    X, y = dummy_train_data
    model = RidgeARXModel(alpha=5.0)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert len(model.feature_coefficients) > 0


def test_gradient_boosted_tree_model(dummy_train_data):
    X, y = dummy_train_data
    model = GradientBoostedTreeModel(n_estimators=30, max_depth=3)
    model.fit(X, y)
    preds, lower, upper = model.predict_with_intervals(X, confidence_level=0.95)
    assert len(preds) == len(X)
    assert len(model.feature_importances) > 0
    assert np.all(lower <= preds)
    assert np.all(preds <= upper)


# === backend/tests/test_feature_engineering.py ===
"""
Tests for Agricultural Feature Engineering Pipeline
"""

import pandas as pd
import numpy as np
import pytest
from app.ml.feature_engineering import AgriculturalFeatureEngineer


def test_feature_engineering_transforms():
    engineer = AgriculturalFeatureEngineer()

    # Generate test panel records
    dates = pd.date_range("2026-01-01", periods=60)
    data = []
    for d in dates:
        data.append({
            "date": d.strftime("%Y-%m-%d"),
            "commodity": "Tomato",
            "state": "Jharkhand",
            "district": "Ranchi",
            "market": "Ranchi",
            "modal_price": 25.0 + np.sin(d.day) * 3.0,
            "min_price": 22.0,
            "max_price": 28.0,
            "arrival_quantity": 400.0,
            "temperature": 26.0,
            "rainfall": 0.0,
            "humidity": 60.0,
            "is_outlier": False
        })
    df = pd.DataFrame(data)

    featured_df = engineer.transform(df)

    # Check that price lags exist
    for lag in [1, 2, 3, 7, 14, 30]:
        assert f"price_lag_{lag}" in featured_df.columns

    # Check rolling metrics
    assert "rolling_mean_7" in featured_df.columns
    assert "volatility_7d" in featured_df.columns

    # Check target horizons
    assert "target_price_1d" in featured_df.columns
    assert "target_price_7d" in featured_df.columns

    # Check feature matrix extraction
    X, y, cols = engineer.get_feature_matrix(featured_df, target_horizon=7)
    assert len(X) > 0
    assert len(y) == len(X)
    assert not X.isnull().any().any()


# === backend/tests/test_data_pipeline.py ===
"""
Tests for Data Quality & Preprocessing Engine
"""

import pandas as pd
import numpy as np
import pytest
from app.ml.data_pipeline import DataQualityEngine


def test_data_quality_cleaning_pipeline():
    engine = DataQualityEngine()

    # Create dummy raw data with anomalies
    raw_data = {
        "date": ["2026-08-01", "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"],
        "commodity": ["Tomato", "Tomato", "Tomato", "Tomato", "Tomato"],
        "state": ["Jharkhand"] * 5,
        "district": ["Ranchi"] * 5,
        "market": ["Ranchi"] * 5,
        "arrival_quantity": [500.0, 500.0, np.nan, 480.0, 520.0],  # duplicate row + missing val
        "min_price": [25.0, 25.0, 45.0, 24.0, 26.0],             # row 2 has min > modal (inverted)
        "max_price": [32.0, 32.0, 28.0, 31.0, 33.0],
        "modal_price": [28.0, 28.0, 2800.0, 27.5, 29.0],         # row 2 has 100x unit error (Rs/quintal)
        "temperature": [25.0, 25.0, 26.0, 27.0, 25.5],
        "rainfall": [0.0, 0.0, 5.0, 0.0, 0.0],
        "humidity": [60.0, 60.0, 65.0, 55.0, 58.0],
    }
    raw_df = pd.DataFrame(raw_data)

    clean_df, stats = engine.clean_and_validate(raw_df)

    # 1. Assert deduplication
    assert len(clean_df) == 4

    # 2. Assert unit error correction (2800 -> 28)
    assert clean_df["modal_price"].max() < 100.0

    # 3. Assert missing value imputation
    assert clean_df["arrival_quantity"].isnull().sum() == 0

    # 4. Assert domain boundaries: min_price <= modal_price <= max_price
    assert (clean_df["min_price"] <= clean_df["modal_price"]).all()
    assert (clean_df["modal_price"] <= clean_df["max_price"]).all()

    # 5. Assert scorecard metrics
    assert stats["total_records_ingested"] == 5
    assert stats["overall_quality_score"] > 0
