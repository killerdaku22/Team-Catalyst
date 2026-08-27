import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.policy_simulation_engine import PolicySimulationEngine, PolicyScenarioRequest

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

def test_freight_subsidy_simulation():
    """Verify freight subsidy produces positive farmer uplift, consumer relief, and high BCR."""
    req = PolicyScenarioRequest(
        scenario_title="Inter-State Rail Freight Relief",
        policy_type="FREIGHT_SUBSIDY",
        target_commodity="Tomato",
        target_region="Kolar to Delhi",
        intervention_magnitude_pct=30.0,
        estimated_regional_volume_tonnes=5000.0,
        baseline_retail_price_per_kg=40.0,
        baseline_farmer_price_per_kg=22.0
    )
    result = PolicySimulationEngine.simulate_policy_intervention(req)
    
    assert result.farmer_earnings_uplift_total_inr > 0
    assert result.total_government_fiscal_outlay_inr > 0
    assert result.benefit_cost_ratio >= 1.0
    assert result.projected_new_farmer_price_per_kg > result.baseline_farmer_price_per_kg if hasattr(result, 'baseline_farmer_price_per_kg') else result.projected_new_farmer_price_per_kg > 22.0
    assert result.market_distortion_risk == "LOW"

def test_buffer_stock_release_simulation():
    """Verify strategic buffer stock release reduces retail price strain."""
    req = PolicyScenarioRequest(
        scenario_title="Strategic Onion Buffer Release",
        policy_type="BUFFER_STOCK_RELEASE",
        target_commodity="Onion",
        target_region="Delhi-NCR",
        intervention_magnitude_pct=25.0,
        estimated_regional_volume_tonnes=10000.0,
        baseline_retail_price_per_kg=40.0,
        baseline_farmer_price_per_kg=22.0
    )
    result = PolicySimulationEngine.simulate_policy_intervention(req)
    
    assert result.projected_new_retail_price_per_kg < 40.0
    assert result.consumer_savings_total_inr > 0
    assert result.market_distortion_risk == "MODERATE"

def test_storage_subsidy_simulation():
    """Verify storage subsidy prevents distress sale and achieves high benefit-to-cost ratio."""
    req = PolicyScenarioRequest(
        scenario_title="Cold Storage Power Subsidy",
        policy_type="STORAGE_SUBSIDY",
        target_commodity="Potato",
        target_region="Agra Belt",
        intervention_magnitude_pct=50.0,
        estimated_regional_volume_tonnes=8000.0,
        baseline_retail_price_per_kg=20.0,
        baseline_farmer_price_per_kg=12.0
    )
    result = PolicySimulationEngine.simulate_policy_intervention(req)
    
    assert result.benefit_cost_ratio >= 2.5
    assert result.farmer_earnings_uplift_total_inr > 0

def test_api_policy_endpoints(client: TestClient):
    """Test GET /api/v1/policy/presets and POST /api/v1/policy/simulate API."""
    # 1. Presets endpoint
    res_p = client.get("/api/v1/policy/presets")
    assert res_p.status_code == 200
    presets = res_p.json()
    assert len(presets) >= 3

    # 2. Simulate endpoint
    sim_payload = presets[0]
    res_s = client.post("/api/v1/policy/simulate", json=sim_payload)
    assert res_s.status_code == 200
    data = res_s.json()
    assert data["policy_type"] == sim_payload["policy_type"]
    assert "benefit_cost_ratio" in data
    assert len(data["tradeoff_analysis"]) >= 2
