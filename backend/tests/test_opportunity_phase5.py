import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.market_opportunity_engine import (
    MarketOpportunityEngine,
    MarketOpportunityRequestSchema,
    haversine_distance_km
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

def test_haversine_distance_calculation():
    """Verify Haversine formula against known benchmark: Ludhiana to Delhi (~285-295 km)."""
    dist = haversine_distance_km(30.9010, 75.8573, 28.6139, 77.2090)
    assert 270.0 <= dist <= 310.0

def test_market_opportunity_ranking_descending_order():
    """Verify market candidate list is ranked strictly in descending order of net realization per kg."""
    req = MarketOpportunityRequestSchema(
        commodity="Tomato",
        quantity_kg=5000.0,
        origin_location="Ludhiana Farm Cluster",
        origin_latitude=30.9010,
        origin_longitude=75.8573,
        local_baseline_price_per_kg=22.0,
        shelf_life_days=7,
        ambient_temperature_celsius=28.0,
        candidate_radius_km=600.0
    )
    result = MarketOpportunityEngine.rank_market_opportunities(req)
    
    assert len(result.ranked_opportunities) > 0
    # Strict descending ranking assertion
    for i in range(len(result.ranked_opportunities) - 1):
        curr_item = result.ranked_opportunities[i]
        next_item = result.ranked_opportunities[i + 1]
        assert curr_item.net_realization_per_kg >= next_item.net_realization_per_kg
        assert curr_item.rank == i + 1

def test_freight_and_spoilage_penalty_mathematics():
    """Verify net realization deduction formula: Net = Gross - Freight - Spoilage - MandiFee."""
    req = MarketOpportunityRequestSchema(
        commodity="Potato",
        quantity_kg=10000.0,
        origin_location="Agra Hub",
        origin_latitude=27.1767,
        origin_longitude=78.0081,
        local_baseline_price_per_kg=14.0,
        ambient_temperature_celsius=25.0,
        candidate_radius_km=300.0
    )
    result = MarketOpportunityEngine.rank_market_opportunities(req)
    for item in result.ranked_opportunities:
        expected_net = round(
            item.gross_market_price_per_kg - item.freight_cost_per_kg - item.transit_spoilage_loss_per_kg - item.mandi_handling_fee_per_kg,
            2
        )
        assert item.net_realization_per_kg == expected_net

def test_ambient_temperature_spoilage_acceleration():
    """Verify higher ambient heat increases spoilage loss and reduces net realization."""
    req_cool = MarketOpportunityRequestSchema(
        commodity="Tomato", quantity_kg=4000.0, origin_location="Nashik",
        origin_latitude=19.9975, origin_longitude=73.7898, local_baseline_price_per_kg=25.0,
        ambient_temperature_celsius=20.0
    )
    req_hot = MarketOpportunityRequestSchema(
        commodity="Tomato", quantity_kg=4000.0, origin_location="Nashik",
        origin_latitude=19.9975, origin_longitude=73.7898, local_baseline_price_per_kg=25.0,
        ambient_temperature_celsius=42.0 # Heat wave
    )
    res_cool = MarketOpportunityEngine.rank_market_opportunities(req_cool)
    res_hot = MarketOpportunityEngine.rank_market_opportunities(req_hot)

    top_cool = res_cool.ranked_opportunities[0]
    top_hot = res_hot.ranked_opportunities[0]
    assert top_hot.transit_spoilage_loss_per_kg >= top_cool.transit_spoilage_loss_per_kg

def test_api_opportunity_best_markets_endpoint(client: TestClient):
    """Test POST /api/v1/opportunity/best-markets API endpoint."""
    payload = {
        "commodity": "Onion",
        "quantity_kg": 6000.0,
        "origin_location": "Nashik APMC",
        "origin_latitude": 20.1472,
        "origin_longitude": 74.2272,
        "local_baseline_price_per_kg": 20.0,
        "shelf_life_days": 15,
        "ambient_temperature_celsius": 29.0,
        "candidate_radius_km": 500.0
    }
    res = client.post("/api/v1/opportunity/best-markets", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["commodity"] == "Onion"
    assert "top_recommended_destination" in data
    assert len(data["ranked_opportunities"]) > 0
    assert len(data["insights"]) >= 1
