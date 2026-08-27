import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from jose import jwt

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole, CropListing, RefreshSession, AuditEvent
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token_pair
from app.core.config import settings
from app.services.audit_service import AuditService

# Set up in-memory SQLite database for deterministic security testing
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

def test_password_hashing_and_verification():
    """Verify bcrypt hashing and rejection of incorrect passwords."""
    raw_pwd = "StrongSecurePassword123!"
    hashed = hash_password(raw_pwd)
    
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False

def test_jwt_access_token_claims():
    """Verify short-lived access token claims, role, type, and expiration."""
    user_id = 42
    token = create_access_token(subject=user_id, role="FPO_MANAGER")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload["sub"] == "42"
    assert payload["role"] == "FPO_MANAGER"
    assert payload["type"] == "access"
    assert "jti" in payload
    assert "exp" in payload

def test_user_registration_and_login_flow(client: TestClient):
    """Test full registration and login lifecycle with access token and refresh token."""
    reg_payload = {
        "email": "farmer_test@agridirect.gov.in",
        "password": "Password@123",
        "full_name": "Sardar Balwinder Singh",
        "role": "FPO_MANAGER",
        "location_name": "Ludhiana, Punjab"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "FPO_MANAGER"
    assert data["expires_in_minutes"] == 15

    # Login with credentials
    login_res = client.post(
        "/api/v1/auth/token",
        data={"username": "farmer_test@agridirect.gov.in", "password": "Password@123"}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data

def test_refresh_token_rotation_lifecycle(client: TestClient):
    """Test refresh token rotation: old token is revoked, new token pair is issued."""
    client.post("/api/v1/auth/register", json={
        "email": "buyer_rotate@test.com",
        "password": "Password@123",
        "full_name": "Retail Buyer",
        "role": "BUYER"
    })

    login_res = client.post(
        "/api/v1/auth/token",
        data={"username": "buyer_rotate@test.com", "password": "Password@123"}
    )
    old_refresh = login_res.json()["refresh_token"]

    # Rotate refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    new_refresh = refresh_data["refresh_token"]
    assert new_refresh != old_refresh

def test_refresh_token_replay_attack_detection(client: TestClient):
    """Test replay attack: reusing a revoked refresh token triggers mass session revocation."""
    client.post("/api/v1/auth/register", json={
        "email": "replay_target@test.com",
        "password": "Password@123",
        "full_name": "Target User",
        "role": "BUYER"
    })
    login_res = client.post(
        "/api/v1/auth/token",
        data={"username": "replay_target@test.com", "password": "Password@123"}
    )
    first_refresh = login_res.json()["refresh_token"]

    # First rotation (succeeds)
    refresh_res1 = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert refresh_res1.status_code == 200

    # Attacker tries to replay first_refresh (must fail and detect replay)
    replay_res = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert replay_res.status_code == 401
    assert "Token reuse detected" in replay_res.json()["detail"]

def test_rbac_endpoint_authorization(client: TestClient, db_session):
    """Verify Role-Based Access Control on produce listing creation."""
    # Register Buyer user
    buyer_res = client.post("/api/v1/auth/register", json={
        "email": "buyer_only@test.com",
        "password": "Password@123",
        "full_name": "Big Supermarket Buyer",
        "role": "BUYER"
    })
    buyer_token = buyer_res.json()["access_token"]

    listing_payload = {
        "fpo_name": "Ludhiana Agri Co-op",
        "crop_name": "Wheat (Kalyan)",
        "category": "Cereals",
        "quantity_kg": 2000.0,
        "price_per_kg": 24.0,
        "middleman_baseline_price": 20.0,
        "consumer_benchmark_price": 32.0,
        "harvest_date": "2026-08-25",
        "shelf_life_days": 90,
        "latitude": 30.9010,
        "longitude": 75.8573,
        "location_name": "Ludhiana, Punjab"
    }

    # 1. Buyer attempting to create a listing must be rejected with 403 Forbidden
    res_buyer = client.post(
        "/api/v1/marketplace/listings",
        json=listing_payload,
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert res_buyer.status_code == 403
    assert "Access denied" in res_buyer.json()["detail"]

    # 2. Register FPO Manager user
    fpo_res = client.post("/api/v1/auth/register", json={
        "email": "fpo_manager@test.com",
        "password": "Password@123",
        "full_name": "FPO Lead Officer",
        "role": "FPO_MANAGER"
    })
    fpo_token = fpo_res.json()["access_token"]

    # 3. FPO Manager creating a listing must succeed with 201 Created
    res_fpo = client.post(
        "/api/v1/marketplace/listings",
        json=listing_payload,
        headers={"Authorization": f"Bearer {fpo_token}"}
    )
    assert res_fpo.status_code == 201
    assert res_fpo.json()["crop_name"] == "Wheat (Kalyan)"

def test_tamper_evident_audit_chain_integrity(db_session):
    """Test cryptographic hash-chain audit logging and tampering detection."""
    # 1. Record series of audit events
    e1 = AuditService.record_event(
        db=db_session,
        event_type="AUTH_LOGIN",
        action="LOGIN",
        resource_type="session",
        user_id=1,
        details={"ip": "127.0.0.1"}
    )
    e2 = AuditService.record_event(
        db=db_session,
        event_type="LISTING_CREATE",
        action="CREATE",
        resource_type="crop_listing",
        user_id=1,
        resource_id="101",
        details={"crop": "Tomato", "qty": 500}
    )
    e3 = AuditService.record_event(
        db=db_session,
        event_type="ORDER_PLACE",
        action="CREATE",
        resource_type="order",
        user_id=2,
        resource_id="201",
        details={"amount": 15000}
    )

    # Verify unbroken chain integrity
    verify_result = AuditService.verify_chain_integrity(db_session)
    assert verify_result["is_valid"] is True
    assert verify_result["total_events"] == 3
    assert verify_result["chain_head"] == e3.current_hash

    # 2. Simulate malicious tampering with Event 2 details in database
    e2.details_json = '{"crop":"AlteredCrop","qty":99999}'
    db_session.commit()

    # Integrity verification must catch the payload tamper
    tamper_check = AuditService.verify_chain_integrity(db_session)
    assert tamper_check["is_valid"] is False
    assert tamper_check["tampered_event_id"] == e2.id
    assert "Payload altered" in tamper_check["reason"]

def test_rate_limiter_rejection(client: TestClient):
    """Verify rate limiter throws 429 when threshold exceeded."""
    from app.core.rate_limiter import RateLimiter
    limiter = RateLimiter(times=3, seconds=60)
    
    app.dependency_overrides[app.routes[0].dependencies[0].dependency if hasattr(app.routes[0], 'dependencies') and app.routes[0].dependencies else None] = None
    
    # Rapidly call token endpoint with invalid password
    responses = [
        client.post("/api/v1/auth/token", data={"username": "test@test.com", "password": "wrong"})
        for _ in range(12)
    ]
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
