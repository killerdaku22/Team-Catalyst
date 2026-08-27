import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.market_intelligence_engine import (
    MarketIntelligenceEngine,
    MarketEventSchema,
    ShockSimulationRequest
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

def test_get_active_intelligence_events():
    """Verify retrieval of default active market shocks with commodity and region filters."""
    all_events = MarketIntelligenceEngine.get_active_events()
    assert len(all_events) >= 3

    # Commodity filter (Onion)
    onion_events = MarketIntelligenceEngine.get_active_events(commodity="Onion")
    assert len(onion_events) >= 1
    assert "Onion" in onion_events[0]["affected_commodities"]

    # Region filter (Punjab)
    punjab_events = MarketIntelligenceEngine.get_active_events(region="Punjab")
    assert len(punjab_events) >= 1
    assert "Punjab" in punjab_events[0]["affected_region"]

def test_register_new_market_event():
    """Verify registration of a new market intelligence event."""
    new_event = MarketEventSchema(
        title="Unseasonal Hailstorm Damage in Agra Potato Belt",
        category="WEATHER_SHOCK",
        affected_region="Uttar Pradesh",
        affected_commodities=["Potato"],
        severity="HIGH",
        supply_impact_pct=-22.0,
        price_shock_multiplier=1.28,
        source="State Agricultural Meteorological Bureau",
        confidence_score=0.92
    )
    saved = MarketIntelligenceEngine.register_event(new_event)
    assert saved["id"].startswith("EVT-2026-")
    assert saved["affected_region"] == "Uttar Pradesh"

    # Query again
    potato_events = MarketIntelligenceEngine.get_active_events(commodity="Potato")
    assert any("Hailstorm" in e["title"] for e in potato_events)

def test_simulate_market_supply_shock_contraction():
    """Verify microeconomic price response when a 25% supply contraction occurs."""
    sim_req = ShockSimulationRequest(
        commodity="Tomato",
        region="Delhi-NCR",
        baseline_modal_price=30.0,
        shock_event_title="Flash Floods in Transport Corridor",
        supply_contraction_pct=25.0,
        elasticity_coefficient=-0.65
    )
    result = MarketIntelligenceEngine.simulate_event_shock(sim_req)
    
    assert result.simulated_shock_price > result.baseline_modal_price
    assert result.price_change_pct > 30.0
    assert result.disruption_severity in ["HIGH", "CRITICAL"]
    assert "buffer stock" in result.recommended_intervention.lower() or "diversion" in result.recommended_intervention.lower()

def test_simulate_harvest_glut_scenario():
    """Verify price easing and procurement recommendation when supply expands (+30%)."""
    sim_req = ShockSimulationRequest(
        commodity="Wheat",
        region="Punjab",
        baseline_modal_price=24.0,
        shock_event_title="Bumper Harvest Inflow",
        supply_contraction_pct=-30.0 # Supply expansion / glut
    )
    result = MarketIntelligenceEngine.simulate_event_shock(sim_req)
    
    assert result.simulated_shock_price < result.baseline_modal_price
    assert result.disruption_severity == "GLUT_CONTAINMENT"
    assert "procurement" in result.recommended_intervention.lower()

def test_api_intelligence_endpoints(client: TestClient):
    """Test GET /api/v1/intelligence/active-events and POST /api/v1/intelligence/simulate-shock API."""
    # 1. Query active events
    res_e = client.get("/api/v1/intelligence/active-events?commodity=Onion")
    assert res_e.status_code == 200
    events = res_e.json()
    assert len(events) >= 1
    assert "price_shock_multiplier" in events[0]

    # 2. What-if shock simulator
    sim_payload = {
        "commodity": "Onion",
        "region": "Maharashtra",
        "baseline_modal_price": 25.0,
        "shock_event_title": "Heavy Rain Deluge",
        "supply_contraction_pct": 20.0,
        "elasticity_coefficient": -0.65
    }
    res_s = client.post("/api/v1/intelligence/simulate-shock", json=sim_payload)
    assert res_s.status_code == 200
    sim_data = res_s.json()
    assert sim_data["commodity"] == "Onion"
    assert sim_data["simulated_shock_price"] > 25.0
    assert len(sim_data["affected_stakeholders"]) >= 3
