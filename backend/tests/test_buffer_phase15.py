import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole
from app.core.security import hash_password, create_access_token
from app.engines.buffer_stock_engine import (
    BufferStockEngine,
    InterventionTriggerRequest
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

def test_list_buffer_inventory():
    """Verify listing strategic reserves and filtering by commodity."""
    reserves = BufferStockEngine.list_buffer_inventory()
    assert len(reserves) >= 3

    onion_silos = BufferStockEngine.list_buffer_inventory(commodity="Onion")
    assert len(onion_silos) >= 1
    assert "Onion" in onion_silos[0]["commodity"]

def test_trigger_market_intervention_logic():
    """Verify price spike trigger, fiscal burden, and benefit-to-cost ratio."""
    req = InterventionTriggerRequest(
        target_commodity="Tomato",
        target_urban_cluster="Delhi-NCR",
        current_market_price_per_kg=60.0,
        historical_benchmark_price_per_kg=35.0, # +71.4% price spike
        release_quantity_tonnes=500.0,
        subsidized_retail_price_per_kg=25.0
    )
    res = BufferStockEngine.trigger_market_intervention(req)
    assert res.is_triggered is True
    assert res.intervention_tier == "MANDATORY_BUFFER_RELEASE"
    assert res.fiscal_subsidy_burden_inr > 0
    assert res.benefit_cost_ratio >= 1.0
    assert res.dispatched_convoy.projected_price_cooling_pct > 0

def test_api_buffer_endpoints(client: TestClient, db_session):
    """Verify API endpoints GET /inventory, GET /active-dispatches, POST /trigger-intervention."""
    user = User(
        email="doca_intervention@gov.in",
        hashed_password=hash_password("Pass123!"),
        full_name="DoCA Price Stabilization Director",
        role=UserRole.GOVT_AUDITOR,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, role="GOVT_AUDITOR")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Inventory
    res = client.get("/api/v1/buffer/inventory")
    assert res.status_code == 200
    assert len(res.json()) >= 3

    # 2. Active Dispatches
    res2 = client.get("/api/v1/buffer/active-dispatches")
    assert res2.status_code == 200

    # 3. Trigger Intervention
    payload = {
        "target_commodity": "Onion",
        "target_urban_cluster": "Mumbai Metro",
        "current_market_price_per_kg": 45.0,
        "historical_benchmark_price_per_kg": 25.0,
        "release_quantity_tonnes": 1000.0,
        "subsidized_retail_price_per_kg": 25.0
    }
    res3 = client.post("/api/v1/buffer/trigger-intervention", json=payload, headers=headers)
    assert res3.status_code == 200
    assert res3.json()["benefit_cost_ratio"] >= 1.0
