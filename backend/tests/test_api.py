import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    def override_get_db():
        try:
            yield session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "SIH26033" in data["problem_statement"]

def test_price_breakdown_api():
    payload = {
        "farmer_target_price_per_kg": 30.0,
        "quantity_kg": 500.0,
        "distance_km": 150.0,
        "middleman_baseline_price_per_kg": 22.0,
        "consumer_benchmark_retail_price_per_kg": 50.0
    }
    response = client.post("/api/v1/marketplace/price-breakdown", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["farmer_earnings_uplift_amount"] > 0
    assert data["consumer_savings_percent"] > 0

def test_demand_forecast_api():
    response = client.get("/api/v1/forecasting/demand-forecast?commodity=Onion&region=Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert data["commodity"] == "Onion"
    assert len(data["demand_forecast"]) == 14

def test_ministry_analytics_api():
    response = client.get("/api/v1/analytics/ministry-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["problem_statement_id"] == "SIH26033"
    assert "macro_metrics" in data
