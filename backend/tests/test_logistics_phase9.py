import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.engines.logistics_engine import (
    LogisticsOptimizationEngine,
    RouteOptimizationRequest,
    PickupStopSchema,
    DestinationHubSchema
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

def test_vrp_capacity_constrained_clustering():
    """Verify that produce pickups exceeding truck capacity are bounded."""
    req = RouteOptimizationRequest(
        pickups=[
            PickupStopSchema(fpo_name="FPO Alpha", crop_name="Tomato", quantity_kg=2500.0, latitude=28.4595, longitude=77.0266),
            PickupStopSchema(fpo_name="FPO Beta", crop_name="Onion", quantity_kg=2000.0, latitude=28.7041, longitude=77.1025),
            PickupStopSchema(fpo_name="FPO Gamma", crop_name="Potato", quantity_kg=2000.0, latitude=28.5355, longitude=77.3910) # 2500+2000+2000 = 6500 > 5000
        ],
        destination=DestinationHubSchema(name="Delhi Hub", latitude=28.6139, longitude=77.2090),
        max_vehicle_capacity_kg=5000.0
    )
    result = LogisticsOptimizationEngine.optimize_pooled_route(req)
    assert result.total_weight_kg <= 5000.0
    assert result.vehicle_capacity_utilization_percent <= 100.0

def test_pooling_distance_and_carbon_savings():
    """Verify that multi-stop pooled load saves distance and carbon emissions vs separate solo runs."""
    req = RouteOptimizationRequest(
        pickups=[
            PickupStopSchema(fpo_name="Ludhiana Hub", crop_name="Wheat", quantity_kg=1500.0, latitude=30.9010, longitude=75.8573),
            PickupStopSchema(fpo_name="Ambala Hub", crop_name="Wheat", quantity_kg=1800.0, latitude=30.3782, longitude=76.7767),
            PickupStopSchema(fpo_name="Karnal Hub", crop_name="Rice", quantity_kg=1200.0, latitude=29.6857, longitude=76.9905)
        ],
        destination=DestinationHubSchema(name="Delhi Terminal", latitude=28.6139, longitude=77.2090),
        max_vehicle_capacity_kg=5000.0
    )
    result = LogisticsOptimizationEngine.optimize_pooled_route(req)
    
    assert result.distance_saved_vs_unpooled_km > 50.0
    assert result.co2_saved_kg > 10.0
    assert result.stops_count == 4 # 3 pickups + 1 destination

def test_fpo_prorata_cost_allocations():
    """Verify that participating FPOs along a trade corridor save freight money when joining a pooled route."""
    req = RouteOptimizationRequest(
        pickups=[
            PickupStopSchema(fpo_name="Ludhiana FPO", crop_name="Wheat", quantity_kg=2000.0, latitude=30.9010, longitude=75.8573),
            PickupStopSchema(fpo_name="Ambala FPO", crop_name="Paddy", quantity_kg=2500.0, latitude=30.3782, longitude=76.7767)
        ],
        destination=DestinationHubSchema(name="Delhi Azadpur Terminal", latitude=28.6139, longitude=77.2090),
        max_vehicle_capacity_kg=5000.0
    )
    result = LogisticsOptimizationEngine.optimize_pooled_route(req)
    
    assert len(result.fpo_cost_allocations) == 2
    for alloc in result.fpo_cost_allocations:
        assert alloc.freight_savings_inr > 0
        assert alloc.savings_percent > 5.0

def test_api_logistics_optimize_route_endpoint(client: TestClient):
    """Test POST /api/v1/logistics/optimize-route endpoint."""
    payload = {
        "pickups": [
            {"fpo_name": "Kolar FPO", "crop_name": "Tomato", "quantity_kg": 1800.0, "latitude": 13.1367, "longitude": 78.1292},
            {"fpo_name": "Hosur FPO", "crop_name": "Capsicum", "quantity_kg": 1500.0, "latitude": 12.7409, "longitude": 77.8253}
        ],
        "destination": {"name": "Bengaluru Yeshwanthpur Hub", "latitude": 13.0238, "longitude": 77.5529},
        "max_vehicle_capacity_kg": 5000.0
    }
    res = client.post("/api/v1/logistics/optimize-route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["stops_count"] == 3
    assert data["total_weight_kg"] == 3300.0
    assert "route_waypoints" in data
    assert len(data["fpo_cost_allocations"]) == 2
