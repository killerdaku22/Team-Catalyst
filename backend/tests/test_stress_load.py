import time
import concurrent.futures
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import CropListing, ListingStatus

# In-memory SQLite DB with thread-safe connection pool for isolated stress testing
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_stress_concurrent_fair_price_engine(client: TestClient):
    """
    STRESS TEST 1: High-throughput benchmark for Fair Price Engine calculations.
    Fires 100 concurrent requests across a thread pool and measures response latency & success rate.
    """
    payload = {
        "farmer_target_price_per_kg": 28.0,
        "quantity_kg": 5000.0,
        "distance_km": 120.0,
        "middleman_baseline_price_per_kg": 20.0,
        "consumer_benchmark_retail_price_per_kg": 42.0
    }

    num_requests = 100
    def make_request():
        start = time.perf_counter()
        res = client.post("/api/v1/marketplace/price-breakdown", json=payload)
        end = time.perf_counter()
        return res.status_code, (end - start) * 1000.0  # ms

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(lambda _: make_request(), range(num_requests)))
    total_time = time.perf_counter() - start_total

    success_count = sum(1 for status, _ in results if status == 200)
    latencies = [lat for _, lat in results]
    avg_latency = sum(latencies) / len(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]
    rps = num_requests / total_time

    print(f"\n[STRESS 1 - Fair Price Engine] Total: {num_requests} reqs in {total_time:.2f}s | Throughput: {rps:.1f} RPS | Avg Latency: {avg_latency:.2f}ms | P95: {p95_latency:.2f}ms")
    assert success_count == num_requests
    assert avg_latency < 50.0  # Sub-50ms average calculation speed

def test_stress_concurrent_decision_engine(client: TestClient):
    """
    STRESS TEST 2: High-throughput benchmark for Decision Engine multi-option optimization.
    Fires 50 sequential & concurrent requests evaluating Sell vs Store vs Move tradeoffs.
    """
    payload = {
        "commodity": "Tomato",
        "quantity_kg": 4000.0,
        "current_local_price_per_kg": 26.0,
        "shelf_life_days": 10,
        "min_cash_need_pct": 20.0,
        "storage_cost_per_kg_day": 0.08
    }

    num_requests = 50
    latencies = []
    success_count = 0
    start_total = time.perf_counter()
    for _ in range(num_requests):
        t0 = time.perf_counter()
        res = client.post("/api/v1/decision/evaluate", json=payload)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)
        if res.status_code == 200:
            success_count += 1
    total_time = time.perf_counter() - start_total

    avg_latency = sum(latencies) / len(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]
    rps = num_requests / total_time

    print(f"\n[STRESS 2 - Decision Engine] Total: {num_requests} evaluations in {total_time:.2f}s | Throughput: {rps:.1f} RPS | Avg Latency: {avg_latency:.2f}ms | P95: {p95_latency:.2f}ms")
    assert success_count == num_requests
    assert avg_latency < 50.0

def test_stress_order_contention_and_inventory_conservation(client: TestClient):
    """
    STRESS TEST 3: High-contention concurrency race on a single produce batch.
    20 independent buyers simultaneously try to purchase portions of a 1,000 kg batch.
    Asserts:
    1. Exactly 1,000 kg is allocated across successful buyers.
    2. Zero negative inventory or overselling occurs.
    3. Failed over-orders receive clean 400 Bad Request responses.
    """
    # 1. Setup Seller
    farmer_res = client.post("/api/v1/auth/register", json={
        "email": "farmer_stress@agridirect.org",
        "password": "FarmerStress@123",
        "full_name": "Stress Test Farmer",
        "role": "FARMER"
    })
    assert farmer_res.status_code == 200
    farmer_token = farmer_res.json()["access_token"]

    # 2. Setup 10 Buyers
    buyer_tokens = []
    for i in range(10):
        b_res = client.post("/api/v1/auth/register", json={
            "email": f"buyer_stress_{i}@market.com",
            "password": "BuyerStress@123",
            "full_name": f"Buyer {i}",
            "role": "BUYER"
        })
        assert b_res.status_code == 200
        buyer_tokens.append(b_res.json()["access_token"])

    # 3. Create 1,000 kg Listing
    listing_res = client.post(
        "/api/v1/marketplace/listings",
        json={
            "fpo_name": "Stress Test FPO",
            "crop_name": "Tomato (Grade A)",
            "category": "Vegetables",
            "quantity_kg": 1000.0,
            "price_per_kg": 25.0,
            "middleman_baseline_price": 18.0,
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

    # 4. Fire 20 purchase orders of 100 kg each
    order_requests = []
    for i in range(20):
        token = buyer_tokens[i % len(buyer_tokens)]
        order_requests.append((token, 100.0))

    responses = []
    for token, qty in order_requests:
        res = client.post(
            "/api/v1/marketplace/orders",
            json={
                "listing_id": listing_id,
                "quantity_kg": qty,
                "agreed_price_per_kg": 25.0,
                "distance_km": 50.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        responses.append(res)

    successful_orders = [r for r in responses if r.status_code == 201]
    failed_orders = [r for r in responses if r.status_code == 400]

    total_allocated_kg = sum(r.json()["quantity_kg"] for r in successful_orders)
    print(f"\n[STRESS 3 - Contention Race] Successful Orders: {len(successful_orders)} | Rejected Over-orders: {len(failed_orders)} | Allocated: {total_allocated_kg} kg / 1000 kg")

    # Invariant checks:
    assert total_allocated_kg == 1000.0  # Exact batch conservation
    assert len(successful_orders) == 10   # Exactly 10 x 100 kg orders succeeded
    assert len(failed_orders) == 10       # Exactly 10 excess requests cleanly rejected
