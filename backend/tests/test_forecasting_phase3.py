import pytest
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.forecasting_engine import (
    ForecastingMetrics,
    NaiveModel,
    MovingAverageModel,
    HoltWintersLinearModel,
    RidgeAutoregressiveMLModel,
    DemandForecastingEngine
)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_forecasting_metrics_calculation():
    """Verify MAE, RMSE, and MAPE formulas against known expected values."""
    y_true = np.array([20.0, 25.0, 30.0, 35.0])
    y_pred = np.array([22.0, 24.0, 29.0, 37.0])
    
    # Absolute errors: [2, 1, 1, 2] -> mean = 1.5
    assert ForecastingMetrics.calculate_mae(y_true, y_pred) == 1.5
    
    # Squared errors: [4, 1, 1, 4] -> mean = 2.5 -> sqrt(2.5) = 1.5811
    assert round(ForecastingMetrics.calculate_rmse(y_true, y_pred), 3) == 1.581
    
    # Percentage errors: [10%, 4%, 3.33%, 5.71%] -> mean = 5.76%
    assert round(ForecastingMetrics.calculate_mape(y_true, y_pred), 2) == 5.76

def test_baseline_models_execution():
    """Verify Naive, Moving Average, and Holt-Winters predictions."""
    series = np.array([20.0, 22.0, 24.0, 26.0, 28.0, 30.0, 32.0])
    
    # 1. Naive Model
    naive_out = NaiveModel.forecast(series, horizon=5)
    assert len(naive_out) == 5
    assert np.all(naive_out == 32.0)

    # 2. Moving Average (window=3: [28, 30, 32] -> mean=30.0)
    ma_out = MovingAverageModel.forecast(series, horizon=5, window=3)
    assert len(ma_out) == 5
    assert np.all(ma_out == 30.0)

    # 3. Holt-Winters Linear (strictly increasing trend)
    hw_out, level, trend = HoltWintersLinearModel.fit_and_forecast(series, horizon=5)
    assert len(hw_out) == 5
    assert hw_out[-1] > hw_out[0]  # Positive upward trend

def test_multi_model_backtesting_and_selection():
    """Verify backtesting evaluation across all 4 models and selection of optimal model."""
    historical = [
        {"modal_price": 25.0 + i * 0.5, "arrival_tonnes": 150.0 - i * 2.0, "record_date": f"2026-05-{i+1:02d}"}
        for i in range(25)
    ]

    result = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name="Tomato",
        region="Nashik",
        historical_records=historical,
        days_ahead=14,
        preferred_model="auto"
    )

    assert result["commodity"] == "Tomato"
    assert result["region"] == "Nashik"
    assert len(result["demand_forecast"]) == 14
    assert len(result["baseline_comparison"]) == 4
    
    # Verify all 4 models have valid evaluation metrics
    for model_meta in result["baseline_comparison"]:
        assert "mae" in model_meta
        assert "rmse" in model_meta
        assert "mape" in model_meta
        assert model_meta["rmse"] >= 0.0

    assert "model_metrics" in result
    assert result["model_metrics"]["test_horizon_samples"] > 0

def test_widening_uncertainty_intervals():
    """Verify statistical prediction intervals widen over the 14-day horizon."""
    historical = [
        {"modal_price": 30.0 + (i % 3), "arrival_tonnes": 200.0, "record_date": f"2026-05-{i+1:02d}"}
        for i in range(20)
    ]

    result = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name="Onion",
        region="Maharashtra",
        historical_records=historical,
        days_ahead=14
    )

    forecast = result["demand_forecast"]
    day_1_band = forecast[0]["price_confidence_high"] - forecast[0]["price_confidence_low"]
    day_14_band = forecast[13]["price_confidence_high"] - forecast[13]["price_confidence_low"]

    # Statistical interval at day 14 must be strictly wider than day 1 due to horizon uncertainty
    assert day_14_band > day_1_band
    assert forecast[13]["uncertainty_interval_pct"] > forecast[0]["uncertainty_interval_pct"]

def test_weather_telemetry_impact_and_drivers():
    """Verify extreme rainfall triggers supply tightening multiplier and explainable driver."""
    historical = [
        {"modal_price": 28.0, "arrival_tonnes": 150.0, "record_date": f"2026-05-{i+1:02d}"}
        for i in range(15)
    ]

    # Run with heavy rain telemetry (40mm)
    result = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name="Tomato",
        region="Kolar",
        historical_records=historical,
        days_ahead=7,
        weather_telemetry={"temperature": 29.0, "rainfall_mm": 45.0, "humidity": 85.0}
    )

    # Key drivers must include rainfall alert
    drivers_text = " ".join(result["key_drivers"])
    assert "Heavy rainfall" in drivers_text or "rainfall" in drivers_text.lower()
    assert "Optimal Model Selected" in drivers_text

def test_api_forecasting_and_benchmark_endpoints(client: TestClient):
    """Test /api/v1/forecasting/demand-forecast and /api/v1/forecasting/models-benchmark API."""
    # 1. Demand forecast endpoint
    res_f = client.get("/api/v1/forecasting/demand-forecast?commodity=Wheat&region=Punjab&days_ahead=14")
    assert res_f.status_code == 200
    f_data = res_f.json()
    assert f_data["commodity"] == "Wheat"
    assert len(f_data["demand_forecast"]) == 14
    assert "weather_telemetry" in f_data
    assert "model_metrics" in f_data

    # 2. Models benchmark endpoint
    res_b = client.get("/api/v1/forecasting/models-benchmark?commodity=Potato&region=Agra")
    assert res_b.status_code == 200
    b_data = res_b.json()
    assert len(b_data["baseline_comparison"]) == 4
    assert "active_model" in b_data
