import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import MandiPriceRecord, User, UserRole
from app.services.data_quality_service import DataQualityService
from app.services.mandi_ingestion_service import MandiIngestionService

# In-memory SQLite for data tests
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

def test_commodity_name_normalization():
    """Verify commodity alias and parenthetical cleaning into canonical names."""
    assert DataQualityService.normalize_commodity_name("Tomato Local") == "Tomato"
    assert DataQualityService.normalize_commodity_name("Tomato Hybrid") == "Tomato"
    assert DataQualityService.normalize_commodity_name("Paddy(Dhan)(Common)") == "Paddy"
    assert DataQualityService.normalize_commodity_name("Bengal Gram(Gram)(Whole)") == "Gram"
    assert DataQualityService.normalize_commodity_name("Bajra(Pearl Millet/Cumbu)") == "Bajra"
    assert DataQualityService.normalize_commodity_name("Cucumbar(Kheera)") == "Cucumber"
    assert DataQualityService.normalize_commodity_name("Wheat (Kalyan)") == "Wheat"

def test_date_format_normalization():
    """Verify conversion of various date string formats into standard ISO YYYY-MM-DD."""
    assert DataQualityService.normalize_date("19/05/2025") == "2025-05-19"
    assert DataQualityService.normalize_date("2026-08-25") == "2026-08-25"
    assert DataQualityService.normalize_date("15-08-2024") == "2024-08-15"

def test_quintal_to_kg_and_band_correction():
    """Verify ₹/Quintal to ₹/kg conversion and automatic correction of inverted price bands."""
    raw = {
        "state": "Gujarat",
        "district": "Amreli",
        "mandi_name": "Damnagar",
        "commodity": "Tomato Local",
        "min_price": 3200.0, # Inverted: min > max
        "max_price": 2400.0,
        "modal_price": 2800.0,
        "arrival_tonnes": 15.0,
        "record_date": "19/05/2025"
    }
    is_valid, cleaned, flags = DataQualityService.validate_and_clean_record(raw)
    assert is_valid is True
    assert cleaned["commodity"] == "Tomato"
    assert cleaned["min_price"] == 2400.0
    assert cleaned["max_price"] == 3200.0
    assert cleaned["price_per_kg"] == 28.0 # 2800 / 100
    assert cleaned["record_date"] == "2025-05-19"
    assert "PRICE_BAND_INVERTED_CORRECTED" in flags

def test_negative_and_extreme_outlier_rejection():
    """Verify invalid negative prices and absurd outliers are rejected."""
    # 1. Negative price
    bad_price = {
        "state": "Punjab", "district": "Ludhiana", "mandi_name": "Ludhiana Mandi",
        "commodity": "Wheat", "min_price": -100, "max_price": 2000, "modal_price": -50,
        "arrival_tonnes": 50, "record_date": "2026-05-01"
    }
    valid_p, _, flags_p = DataQualityService.validate_and_clean_record(bad_price)
    assert valid_p is False
    assert "PRICE_NON_POSITIVE" in flags_p

    # 2. Extreme outlier (e.g. Rs 60,000/kg potato)
    outlier_price = {
        "state": "Uttar Pradesh", "district": "Agra", "mandi_name": "Agra Yard",
        "commodity": "Potato", "min_price": 6000000, "max_price": 7000000, "modal_price": 6500000,
        "arrival_tonnes": 10, "record_date": "2026-05-01"
    }
    valid_o, _, flags_o = DataQualityService.validate_and_clean_record(outlier_price)
    assert valid_o is False
    assert "EXTREME_OUTLIER_REJECTED" in flags_o

def test_batch_ingestion_and_deduplication(db_session):
    """Test ingestion pipeline processes clean records, rejects anomalies, and skips duplicates."""
    batch = [
        # Record 1: Clean
        {"state": "Punjab", "district": "Ludhiana", "mandi_name": "Mandi A", "commodity": "Wheat", "min_price": 2100, "max_price": 2500, "modal_price": 2300, "arrival_tonnes": 100, "record_date": "2026-05-01"},
        # Record 2: Duplicate of Record 1 in same batch
        {"state": "Punjab", "district": "Ludhiana", "mandi_name": "Mandi A", "commodity": "Wheat", "min_price": 2100, "max_price": 2500, "modal_price": 2300, "arrival_tonnes": 100, "record_date": "2026-05-01"},
        # Record 3: Invalid (Negative arrival)
        {"state": "Punjab", "district": "Ludhiana", "mandi_name": "Mandi B", "commodity": "Wheat", "min_price": 2100, "max_price": 2500, "modal_price": 2300, "arrival_tonnes": -10, "record_date": "2026-05-01"},
        # Record 4: Clean Tomato
        {"state": "Maharashtra", "district": "Nashik", "mandi_name": "Lasalgaon", "commodity": "Onion Red", "min_price": 1800, "max_price": 2200, "modal_price": 2000, "arrival_tonnes": 400, "record_date": "2026-05-01"}
    ]

    report = MandiIngestionService.ingest_records_batch(
        db=db_session,
        raw_records=batch,
        source_label="TEST_SUITE"
    )

    assert report["total_processed"] == 4
    assert report["valid_records_saved"] == 2 # Mandi A + Lasalgaon
    assert report["duplicates_skipped"] == 1
    assert report["rejected_records"] == 1

    # Quality scorecard
    summary = MandiIngestionService.get_data_quality_summary(db_session)
    assert summary["total_records"] == 2
    assert summary["validated_records_count"] == 2
    assert summary["unique_commodities_count"] == 2 # Wheat, Onion
    assert summary["data_health_score"] == 100.0

def test_api_canonical_mandi_prices_and_quality_scorecard(client: TestClient, db_session):
    """Test API endpoint retrieving filtered canonical mandi price records."""
    # Seed data
    batch = [
        {"state": "Punjab", "district": "Ludhiana", "mandi_name": "Ludhiana Central", "commodity": "Wheat (Kalyan)", "min_price": 2200, "max_price": 2600, "modal_price": 2400, "arrival_tonnes": 80, "record_date": "2026-05-10"},
        {"state": "Karnataka", "district": "Kolar", "mandi_name": "Kolar APMC", "commodity": "Tomato Local", "min_price": 2800, "max_price": 3400, "modal_price": 3100, "arrival_tonnes": 120, "record_date": "2026-05-10"}
    ]
    MandiIngestionService.ingest_records_batch(db=db_session, raw_records=batch, source_label="SEED")

    # 1. Query by commodity
    res = client.get("/api/v1/data/mandi-prices?commodity=Tomato")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["commodity"] == "Tomato"
    assert data[0]["price_per_kg"] == 31.0
    assert data[0]["mandi_name"] == "Kolar Apmc"

    # 2. Quality summary endpoint
    res_q = client.get("/api/v1/data/quality-summary")
    assert res_q.status_code == 200
    q_data = res_q.json()
    assert q_data["total_records"] == 2
    assert q_data["unique_commodities_count"] == 2
    assert "SEED" in q_data["sources_breakdown"]
