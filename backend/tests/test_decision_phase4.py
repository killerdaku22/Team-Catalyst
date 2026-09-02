import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.decision_engine import AgriculturalDecisionEngine, BatchDecisionRequestSchema

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

def test_sell_now_when_markets_flat_and_storage_costly():
    """When future price is declining and storage fees erode value, optimal decision must be SELL_NOW."""
    req = BatchDecisionRequestSchema(
        commodity="Tomato",
        quantity_kg=2000.0,
        current_local_price_per_kg=35.0, # High current price
        shelf_life_days=7,
        storage_cost_per_kg_day=0.15,
        daily_spoilage_rate=0.01,
        forecasted_prices=[34.0, 33.0, 31.0, 30.0, 28.0, 26.0, 25.0], # Falling prices
        alternative_markets=[{"market_name": "Far Mandi", "price_per_kg": 34.0, "distance_km": 150.0}]
    )
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    assert result.optimal_action == "SELL_NOW"
    assert result.net_uplift_vs_local_sell_now == 0.0

def test_store_recommendation_when_sharp_price_spike_forecasted():
    """When future price rises significantly higher than storage fees, optimal decision must be STORE."""
    req = BatchDecisionRequestSchema(
        commodity="Potato",
        quantity_kg=5000.0,
        current_local_price_per_kg=15.0,
        shelf_life_days=60,
        storage_cost_per_kg_day=0.05,
        daily_spoilage_rate=0.001,
        forecasted_prices=[15.5, 16.2, 17.5, 19.0, 22.0, 24.5, 26.0, 27.5, 28.0, 28.0], # Rising price (+86%)
        alternative_markets=[]
    )
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    assert result.optimal_action == "STORE"
    assert result.net_uplift_vs_local_sell_now > 0
    assert result.net_uplift_pct > 30.0

def test_move_recommendation_when_distant_market_arbitrage_exists():
    """When a distant hub offers high net price after freight, optimal decision must be MOVE."""
    req = BatchDecisionRequestSchema(
        commodity="Onion",
        quantity_kg=4000.0,
        current_local_price_per_kg=20.0,
        shelf_life_days=20,
        forecasted_prices=[20.0] * 14,
        alternative_markets=[
            {"market_name": "Delhi Azadpur Terminal", "price_per_kg": 34.0, "distance_km": 120.0, "transit_hours": 3.5}
        ]
    )
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    assert result.optimal_action == "MOVE"
    assert result.net_uplift_vs_local_sell_now > 0
    assert "Delhi Azadpur" in result.key_decision_factors[0]

def test_split_allocation_when_liquidity_is_needed():
    """When farmer specifies 40% immediate cash need, SPLIT allocates exactly 40% to sell now and 60% to upside."""
    req = BatchDecisionRequestSchema(
        commodity="Wheat",
        quantity_kg=10000.0,
        current_local_price_per_kg=22.0,
        shelf_life_days=90,
        min_cash_need_pct=40.0,
        forecasted_prices=[22.5, 23.0, 24.0, 25.5, 27.0, 29.0, 30.0],
        alternative_markets=[]
    )
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    # Check split option payoff
    split_option = next(o for o in result.options_comparison if o.action == "SPLIT")
    assert split_option.details["sell_now_kg"] == 4000.0
    assert split_option.details["optimized_target_kg"] == 6000.0
    assert split_option.expected_net_revenue > (10000 * 22.0)

def test_shelf_life_infeasibility_guard():
    """Perishable item with 2-day shelf life must mark long holding as infeasible."""
    req = BatchDecisionRequestSchema(
        commodity="Spinach",
        quantity_kg=500.0,
        current_local_price_per_kg=15.0,
        shelf_life_days=2,
        forecasted_prices=[16.0, 18.0, 25.0, 30.0]
    )
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    store_option = next(o for o in result.options_comparison if o.action == "STORE")
    assert store_option.feasibility == "INFEASIBLE_SHELF_LIFE"

def test_api_decision_evaluate_endpoint(client: TestClient):
    """Test POST /api/v1/decision/evaluate API response format."""
    payload = {
        "commodity": "Tomato",
        "quantity_kg": 3000.0,
        "current_local_price_per_kg": 25.0,
        "shelf_life_days": 10,
        "storage_cost_per_kg_day": 0.08,
        "daily_spoilage_rate": 0.005,
        "forecasted_prices": [26.0, 27.5, 29.0, 31.0, 33.0, 35.0, 36.0],
        "alternative_markets": [
            {"market_name": "Delhi Terminal Hub", "price_per_kg": 38.0, "distance_km": 140.0, "transit_hours": 4.0}
        ],
        "min_cash_need_pct": 25.0
    }
    res = client.post("/api/v1/decision/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["commodity"] == "Tomato"
    assert data["optimal_action"] in ["SELL_NOW", "STORE", "MOVE", "SPLIT"]
    assert len(data["options_comparison"]) == 4
    assert len(data["key_decision_factors"]) >= 2

def test_decision_engine_freight_sensitivity():
    """Verify that increasing transport distance/freight reduces MOVE payoff and flips recommendation."""
    # Near market with low freight -> MOVE is optimal
    req_near = BatchDecisionRequestSchema(
        commodity="Onion",
        quantity_kg=4000.0,
        current_local_price_per_kg=20.0,
        shelf_life_days=20,
        forecasted_prices=[20.0] * 14,
        alternative_markets=[
            {"market_name": "Near Mandi", "price_per_kg": 30.0, "distance_km": 50.0, "transit_hours": 1.5}
        ]
    )
    res_near = AgriculturalDecisionEngine.evaluate_batch_decision(req_near)
    assert res_near.optimal_action == "MOVE"
    
    # Same price but distant market with massive freight -> MOVE payoff plummets, flips to SELL_NOW
    req_far = BatchDecisionRequestSchema(
        commodity="Onion",
        quantity_kg=4000.0,
        current_local_price_per_kg=20.0,
        shelf_life_days=20,
        forecasted_prices=[20.0] * 14,
        alternative_markets=[
            {"market_name": "Extreme Distant Mandi", "price_per_kg": 30.0, "distance_km": 2500.0, "transit_hours": 72.0}
        ]
    )
    res_far = AgriculturalDecisionEngine.evaluate_batch_decision(req_far)
    assert res_far.optimal_action == "SELL_NOW"

def test_decision_engine_spoilage_and_storage_sensitivity():
    """Verify that high spoilage degradation or exorbitant storage fees erode STORE expected revenue."""
    # Low spoilage (0.1%/day), cheap storage (0.02/kg/day) -> STORE is optimal
    req_optimal_store = BatchDecisionRequestSchema(
        commodity="Potato",
        quantity_kg=5000.0,
        current_local_price_per_kg=15.0,
        shelf_life_days=60,
        storage_cost_per_kg_day=0.02,
        daily_spoilage_rate=0.001,
        forecasted_prices=[15.0, 16.0, 18.0, 22.0, 26.0, 30.0],
        alternative_markets=[]
    )
    res_store = AgriculturalDecisionEngine.evaluate_batch_decision(req_optimal_store)
    assert res_store.optimal_action == "STORE"

    # Same price forecast but massive spoilage (10%/day) and high storage (1.50/kg/day) -> STORE payoff severely degrades
    req_decayed = BatchDecisionRequestSchema(
        commodity="Potato",
        quantity_kg=5000.0,
        current_local_price_per_kg=15.0,
        shelf_life_days=60,
        storage_cost_per_kg_day=1.50,
        daily_spoilage_rate=0.10,
        forecasted_prices=[15.0, 16.0, 18.0, 22.0, 26.0, 30.0],
        alternative_markets=[]
    )
    res_decayed = AgriculturalDecisionEngine.evaluate_batch_decision(req_decayed)
    store_opt = next(o for o in res_store.options_comparison if o.action == "STORE")
    store_dec = next(o for o in res_decayed.options_comparison if o.action == "STORE")
    
    assert store_dec.expected_net_revenue < store_opt.expected_net_revenue
    assert res_decayed.optimal_action != "STORE"


