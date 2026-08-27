import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole
from app.core.security import hash_password, create_access_token
from app.engines.procurement_contract_engine import (
    ProcurementContractEngine,
    ContractCreateRequest,
    QualityInspectionReport
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

def test_list_open_institutional_contracts():
    """Verify listing and filtering open institutional contracts."""
    contracts = ProcurementContractEngine.list_open_contracts()
    assert len(contracts) >= 3

    tomato_contracts = ProcurementContractEngine.list_open_contracts(commodity="Tomato")
    assert len(tomato_contracts) >= 1
    assert "Tomato" in tomato_contracts[0]["commodity"]

def test_fpo_commit_and_accept_contract():
    """Verify FPO acceptance locks in guaranteed contract."""
    contract = ProcurementContractEngine.create_contract(ContractCreateRequest(
        buyer_organization="ITC Agri Business Division",
        buyer_type="FOOD_PROCESSOR",
        commodity="Wheat",
        required_quantity_kg=10000.0,
        offered_price_per_kg=26.50,
        delivery_destination_hub="ITC Sehore Processing Facility",
        destination_latitude=23.2000,
        destination_longitude=77.0800,
        delivery_deadline="2026-09-30",
        max_moisture_pct=11.5
    ))
    cid = contract["id"]
    
    updated = ProcurementContractEngine.commit_fpo_to_contract(
        contract_id=cid,
        fpo_id=101,
        fpo_name="Malwa Kisan Samiti FPO"
    )
    assert updated["status"] == "FPO_COMMITTED"
    assert updated["assigned_fpo_name"] == "Malwa Kisan Samiti FPO"

def test_quality_inspection_settlement_math():
    """Verify legal metrology inspection penalties and net payout calculation."""
    contract = ProcurementContractEngine.create_contract(ContractCreateRequest(
        buyer_organization="Safal Mother Dairy",
        buyer_type="FOOD_PROCESSOR",
        commodity="Tomato",
        required_quantity_kg=4000.0,
        offered_price_per_kg=30.0, # Gross = 120,000 INR
        delivery_destination_hub="Mangolpuri Cold Hub",
        destination_latitude=28.6922,
        destination_longitude=77.0855,
        delivery_deadline="2026-09-10",
        max_moisture_pct=12.0
    ))
    cid = contract["id"]

    # Quality inspection report with 2% excess moisture (14% vs 12% max)
    report = QualityInspectionReport(
        contract_id=cid,
        measured_moisture_pct=14.0, # 2% excess -> 3% penalty
        grade_conformance=True,
        foreign_matter_pct=1.0, # within 2% tolerance
        damage_pct=0.5,
        inspector_id="INSP-007",
        inspection_notes="Grade A produce with minor moisture deviation"
    )
    settlement = ProcurementContractEngine.submit_quality_inspection(report)
    
    assert settlement.gross_payout_inr == 120000.0
    assert settlement.quality_deductions_inr > 0 # Quality deduction applied
    assert settlement.net_fpo_payout_inr < settlement.gross_payout_inr
    assert settlement.disintermediation_savings_vs_mandi_inr > 0
    assert settlement.status == "PAID_OUT"

def test_api_contracts_lifecycle_endpoints(client: TestClient, db_session):
    """Test full API lifecycle: Buyer creates contract -> FPO accepts -> Buyer inspects & settles."""
    # 1. Setup Buyer & FPO Users
    buyer_user = User(
        email="procurement@bigbasket.com",
        hashed_password=hash_password("Pass123!"),
        full_name="BigBasket Sourcing Manager",
        role=UserRole.BUYER,
        is_active=True
    )
    fpo_user = User(
        email="kolar_sec@agridirect.org",
        hashed_password=hash_password("Pass123!"),
        full_name="Kolar Union Secretary",
        role=UserRole.FPO_MANAGER,
        is_active=True
    )
    db_session.add_all([buyer_user, fpo_user])
    db_session.commit()

    buyer_token = create_access_token(subject=buyer_user.id, role="BUYER")
    fpo_token = create_access_token(subject=fpo_user.id, role="FPO_MANAGER")

    # 2. Buyer creates contract
    create_payload = {
        "buyer_organization": "BigBasket Institutional",
        "buyer_type": "INSTITUTIONAL_BUYER",
        "commodity": "Red Onion",
        "target_grade": "Grade A",
        "required_quantity_kg": 6000.0,
        "offered_price_per_kg": 28.0,
        "delivery_destination_hub": "Gurugram Sourcing Facility",
        "destination_latitude": 28.4595,
        "destination_longitude": 77.0266,
        "delivery_deadline": "2026-09-15",
        "max_moisture_pct": 12.0
    }
    c_res = client.post("/api/v1/contracts/create", json=create_payload, headers={"Authorization": f"Bearer {buyer_token}"})
    assert c_res.status_code == 200
    contract_data = c_res.json()
    contract_id = contract_data["id"]

    # 3. FPO accepts contract
    accept_res = client.post(f"/api/v1/contracts/{contract_id}/accept", headers={"Authorization": f"Bearer {fpo_token}"})
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "FPO_COMMITTED"

    # 4. Buyer inspects quality and settles payout
    inspect_payload = {
        "contract_id": contract_id,
        "measured_moisture_pct": 11.5,
        "grade_conformance": True,
        "foreign_matter_pct": 0.8,
        "damage_pct": 0.2,
        "inspector_id": str(buyer_user.id),
        "inspection_notes": "Meets all legal metrology Grade A standards."
    }
    inspect_res = client.post(f"/api/v1/contracts/{contract_id}/inspect-quality", json=inspect_payload, headers={"Authorization": f"Bearer {buyer_token}"})
    assert inspect_res.status_code == 200
    settle_data = inspect_res.json()
    assert settle_data["gross_payout_inr"] == 168000.0
    assert settle_data["net_fpo_payout_inr"] == 168000.0 # No deductions
    assert settle_data["status"] == "PAID_OUT"
