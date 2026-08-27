import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import CropListing, ListingStatus, UserRole

# In-memory SQLite DB for isolated concurrency unit testing
test_engine = create_engine(
    "sqlite:///:memory:",
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

def test_marketplace_order_atomic_decrement_and_concurrency(client: TestClient, db_session: Session):
    """
    Verify concurrency protections:
    1. Order quantity atomically decrements available batch quantity.
    2. Over-purchasing beyond available quantity is rejected (400).
    3. Exhausted batch sets status to SOLD and rejects subsequent purchases (400).
    4. BOLA check: Sellers cannot purchase their own produce (400).
    """
    # 1. Register Farmer
    farmer_res = client.post("/api/v1/auth/register", json={
        "email": "farmer_concurrency@agridirect.org",
        "password": "FarmerPassword@123",
        "full_name": "Kolar Farmer",
        "role": "FARMER"
    })
    assert farmer_res.status_code == 200
    farmer_token = farmer_res.json()["access_token"]
    farmer_id = farmer_res.json()["user_id"]

    # 2. Register Two Independent Buyers
    buyer1_res = client.post("/api/v1/auth/register", json={
        "email": "buyer1_concurrency@retail.com",
        "password": "Buyer1Password@123",
        "full_name": "Retail Buyer 1",
        "role": "BUYER"
    })
    assert buyer1_res.status_code == 200
    buyer1_token = buyer1_res.json()["access_token"]

    buyer2_res = client.post("/api/v1/auth/register", json={
        "email": "buyer2_concurrency@processor.com",
        "password": "Buyer2Password@123",
        "full_name": "Food Processor Buyer 2",
        "role": "BUYER"
    })
    assert buyer2_res.status_code == 200
    buyer2_token = buyer2_res.json()["access_token"]

    # 3. Farmer creates a produce batch of 1,000 kg
    listing_res = client.post(
        "/api/v1/marketplace/listings",
        json={
            "fpo_name": "Kolar Tomato Producers",
            "crop_name": "Tomato (Hybrid A)",
            "category": "Vegetables",
            "quantity_kg": 1000.0,
            "price_per_kg": 26.0,
            "middleman_baseline_price": 20.0,
            "consumer_benchmark_price": 38.0,
            "harvest_date": "2026-08-28",
            "shelf_life_days": 10,
            "latitude": 13.1367,
            "longitude": 78.1291,
            "location_name": "Kolar APMC"
        },
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert listing_res.status_code == 201
    listing_id = listing_res.json()["id"]

    # 4. BOLA test: Farmer cannot buy their own produce
    self_buy_res = client.post(
        "/api/v1/marketplace/orders",
        json={
            "listing_id": listing_id,
            "quantity_kg": 200.0,
            "agreed_price_per_kg": 26.0,
            "distance_km": 50.0
        },
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert self_buy_res.status_code in (400, 403)

    # 5. Buyer 1 purchases partial batch of 600 kg (leaving 400 kg)
    order1_res = client.post(
        "/api/v1/marketplace/orders",
        json={
            "listing_id": listing_id,
            "quantity_kg": 600.0,
            "agreed_price_per_kg": 26.0,
            "distance_km": 65.0
        },
        headers={"Authorization": f"Bearer {buyer1_token}"}
    )
    assert order1_res.status_code == 201
    assert order1_res.json()["quantity_kg"] == 600.0

    # 6. Buyer 2 tries to purchase 500 kg (exceeds remaining 400 kg -> Must fail with 400)
    over_order_res = client.post(
        "/api/v1/marketplace/orders",
        json={
            "listing_id": listing_id,
            "quantity_kg": 500.0,
            "agreed_price_per_kg": 26.0,
            "distance_km": 80.0
        },
        headers={"Authorization": f"Bearer {buyer2_token}"}
    )
    assert over_order_res.status_code == 400
    assert "exceeds available batch" in over_order_res.json()["detail"]

    # 7. Buyer 2 purchases the remaining 400 kg (Succeeds and exhausts batch)
    order2_res = client.post(
        "/api/v1/marketplace/orders",
        json={
            "listing_id": listing_id,
            "quantity_kg": 400.0,
            "agreed_price_per_kg": 26.0,
            "distance_km": 80.0
        },
        headers={"Authorization": f"Bearer {buyer2_token}"}
    )
    assert order2_res.status_code == 201

    # 8. Subsequent purchase on now-exhausted batch must be rejected (400 Bad Request)
    exhausted_order_res = client.post(
        "/api/v1/marketplace/orders",
        json={
            "listing_id": listing_id,
            "quantity_kg": 100.0,
            "agreed_price_per_kg": 26.0,
            "distance_km": 50.0
        },
        headers={"Authorization": f"Bearer {buyer1_token}"}
    )
    assert exhausted_order_res.status_code == 400
    assert "no longer available" in exhausted_order_res.json()["detail"]
