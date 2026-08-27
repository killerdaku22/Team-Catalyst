import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole
from app.core.security import hash_password
from app.services.audit_service import AuditService

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

def test_full_platform_end_to_end_workflow(client: TestClient, db_session):
    """
    End-to-End System Test:
    1. Authenticate FPO User and retrieve rotating token pair.
    2. Query canonical Mandi prices and model benchmarks.
    3. Evaluate SELL/STORE/MOVE/SPLIT economic batch payoff.
    4. Query ranked best market opportunities.
    5. Consolidate pooled multi-stop VRP logistics route.
    6. Simulate DoCA macroeconomic policy intervention.
    7. Cryptographically verify hash-chained audit trail integrity.
    """
    # 1. User Setup & Auth
    hashed_pwd = hash_password("TestPassword@123")
    user = User(
        email="fpo_manager@agridirect.org",
        hashed_password=hashed_pwd,
        full_name="Kolar FPO President",
        role=UserRole.FPO_MANAGER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    login_res = client.post("/api/v1/auth/token", data={
        "username": "fpo_manager@agridirect.org",
        "password": "TestPassword@123"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Demand Forecasting with Multi-Model Benchmarking
    fc_res = client.get("/api/v1/forecasting/demand-forecast?commodity=Tomato&region=Delhi-NCR")
    assert fc_res.status_code == 200
    fc_data = fc_res.json()
    assert "active_model" in fc_data
    assert len(fc_data["demand_forecast"]) > 0

    # 3. Batch Decision Engine Evaluation
    decision_payload = {
        "commodity": "Tomato",
        "quantity_kg": 4000.0,
        "current_local_price_per_kg": 26.0,
        "shelf_life_days": 10,
        "storage_cost_per_kg_day": 0.08,
        "min_cash_need_pct": 25.0,
        "forecasted_prices": [p["predicted_modal_price"] for p in fc_data["demand_forecast"][:7]]
    }
    dec_res = client.post("/api/v1/decision/evaluate", json=decision_payload, headers=headers)
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["optimal_action"] in ["SELL_NOW", "STORE", "MOVE", "SPLIT"]
    assert dec_data["optimal_net_revenue"] > 0

    # 4. Best Market Opportunity Discovery
    opp_payload = {
        "commodity": "Tomato",
        "quantity_kg": 4000.0,
        "origin_location": "Kolar Agri Hub",
        "origin_latitude": 13.1367,
        "origin_longitude": 78.1292,
        "local_baseline_price_per_kg": 26.0,
        "candidate_radius_km": 500.0
    }
    opp_res = client.post("/api/v1/opportunity/best-markets", json=opp_payload, headers=headers)
    assert opp_res.status_code == 200
    opp_data = opp_res.json()
    assert len(opp_data["ranked_opportunities"]) > 0

    # 5. Multi-Stop Pooled VRP Logistics Optimization
    logistics_payload = {
        "pickups": [
            {"fpo_name": "Kolar FPO", "crop_name": "Tomato", "quantity_kg": 2000.0, "latitude": 13.1367, "longitude": 78.1292},
            {"fpo_name": "Hosur FPO", "crop_name": "Tomato", "quantity_kg": 2000.0, "latitude": 12.7409, "longitude": 77.8253}
        ],
        "destination": {"name": "Bengaluru Yeshwanthpur Hub", "latitude": 13.0238, "longitude": 77.5529},
        "max_vehicle_capacity_kg": 5000.0
    }
    log_res = client.post("/api/v1/logistics/optimize-route", json=logistics_payload, headers=headers)
    assert log_res.status_code == 200
    log_data = log_res.json()
    assert log_data["total_weight_kg"] == 4000.0
    assert log_data["vehicle_capacity_utilization_percent"] == 80.0

    # 6. Policy What-If Simulation
    policy_payload = {
        "scenario_title": "Tomato Freight Intervention",
        "policy_type": "FREIGHT_SUBSIDY",
        "target_commodity": "Tomato",
        "target_region": "Kolar-Bengaluru",
        "intervention_magnitude_pct": 30.0,
        "estimated_regional_volume_tonnes": 5000.0,
        "baseline_retail_price_per_kg": 40.0,
        "baseline_farmer_price_per_kg": 26.0
    }
    pol_res = client.post("/api/v1/policy/simulate", json=policy_payload, headers=headers)
    assert pol_res.status_code == 200
    pol_data = pol_res.json()
    assert pol_data["benefit_cost_ratio"] >= 1.0

    # 7. Audit Trail Cryptographic Chain Verification
    audit_res = AuditService.verify_chain_integrity(db_session)
    assert audit_res["is_valid"] is True
    assert audit_res["total_events_checked"] >= 1
