import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole
from app.core.security import hash_password, create_access_token
from app.engines.cold_storage_engine import (
    ColdStorageEngine,
    StorageBookingRequest
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

def test_list_cold_storage_facilities():
    """Verify registered facilities and filter by state."""
    facs = ColdStorageEngine.list_facilities()
    assert len(facs) >= 3

    karnataka_facs = ColdStorageEngine.list_facilities(state="Karnataka")
    assert len(karnataka_facs) >= 1
    assert karnataka_facs[0]["state"] == "Karnataka"

def test_chamber_iot_telemetry_spoilage_math():
    """Verify dynamic IoT spoilage risk index calculation."""
    telemetry = ColdStorageEngine.get_chamber_telemetry("CS-KOL-01")
    assert telemetry.chamber_id == "CH-KOL-01A"
    assert telemetry.spoilage_risk_index_percent >= 0.0
    assert telemetry.chamber_status in ["OPTIMAL", "WARNING_ELEVATED_ETHYLENE", "CRITICAL_TEMPERATURE_EXCURSION"]

def test_fpo_storage_booking_with_subsidy():
    """Verify capacity deduction and DoCA power subsidy math."""
    req = StorageBookingRequest(
        facility_id="CS-KOL-01",
        fpo_name="Kolar Farmers Federation",
        commodity="Tomato",
        quantity_tonnes=10.0, # 10,000 kg
        planned_duration_days=20,
        apply_doca_subsidy=True
    )
    bkg = ColdStorageEngine.book_storage_space(req)
    assert bkg.allocated_quantity_tonnes == 10.0
    assert bkg.gross_storage_fee_inr == 16000.0 # 10,000kg * 0.08 * 20
    assert bkg.doca_subsidy_amount_inr == 7000.0 # (0.08 - 0.045) * 10,000 * 20
    assert bkg.net_payable_fee_inr == 9000.0
    assert bkg.booking_status == "CONFIRMED_SPACE_LOCKED"

def test_api_storage_endpoints(client: TestClient, db_session):
    """Verify API endpoints GET /facilities, GET /telemetry, POST /book."""
    user = User(
        email="fpo_storage@agridirect.org",
        hashed_password=hash_password("Pass123!"),
        full_name="Kolar Storage Secretary",
        role=UserRole.FPO_MANAGER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, role="FPO_MANAGER")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Facilities
    res = client.get("/api/v1/storage/facilities")
    assert res.status_code == 200
    assert len(res.json()) >= 3

    # 2. Chamber Telemetry
    res2 = client.get("/api/v1/storage/CS-KOL-01/telemetry")
    assert res2.status_code == 200
    assert "temperature_celsius" in res2.json()

    # 3. Subsidized Booking
    bkg_payload = {
        "facility_id": "CS-KOL-01",
        "fpo_name": "Kolar Storage Secretary",
        "commodity": "Tomato",
        "quantity_tonnes": 5.0,
        "planned_duration_days": 15,
        "apply_doca_subsidy": True
    }
    res3 = client.post("/api/v1/storage/book", json=bkg_payload, headers=headers)
    assert res3.status_code == 200
    data = res3.json()
    assert data["net_payable_fee_inr"] > 0
    assert data["booking_status"] == "CONFIRMED_SPACE_LOCKED"
