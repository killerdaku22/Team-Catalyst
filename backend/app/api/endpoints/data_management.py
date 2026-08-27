import json
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import MandiPriceRecord, User, UserRole
from app.api.deps import get_current_user, require_roles
from app.schemas.data_schemas import (
    MandiRecordIn,
    CanonicalMandiRecord,
    IngestionReportSchema,
    DataQualitySummarySchema
)
from app.services.mandi_ingestion_service import MandiIngestionService

router = APIRouter()

@router.get("/mandi-prices", response_model=List[CanonicalMandiRecord])
def get_canonical_mandi_prices(
    commodity: Optional[str] = Query(None, description="e.g. Tomato, Wheat, Onion"),
    state: Optional[str] = Query(None, description="e.g. Punjab, Maharashtra"),
    district: Optional[str] = Query(None, description="e.g. Ludhiana, Nashik"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Retrieve validated and normalized canonical market price records.
    """
    query = db.query(MandiPriceRecord)
    if commodity:
        query = query.filter(MandiPriceRecord.commodity.ilike(f"%{commodity}%"))
    if state:
        query = query.filter(MandiPriceRecord.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(MandiPriceRecord.district.ilike(f"%{district}%"))

    records = query.order_by(MandiPriceRecord.record_date.desc()).offset(offset).limit(limit).all()

    result = []
    for r in records:
        try:
            flags = json.loads(r.quality_flags_json) if r.quality_flags_json else []
        except Exception:
            flags = []
        result.append(CanonicalMandiRecord(
            id=r.id,
            state=r.state,
            district=r.district,
            mandi_name=r.mandi_name,
            commodity=r.commodity,
            variety=r.variety,
            min_price_qtl=r.min_price,
            max_price_qtl=r.max_price,
            modal_price_qtl=r.modal_price,
            price_per_kg=r.price_per_kg,
            arrival_tonnes=r.arrival_tonnes,
            record_date=r.record_date,
            source=r.source,
            is_validated=r.is_validated,
            quality_flags=flags
        ))

    return result

@router.post("/ingest-batch", response_model=IngestionReportSchema)
def ingest_mandi_batch(
    records: List[MandiRecordIn],
    current_user: User = Depends(require_roles([UserRole.MINISTRY_ADMIN, UserRole.GOVT_AUDITOR, UserRole.ADMIN, UserRole.FPO_MANAGER])),
    db: Session = Depends(get_db)
):
    """
    Ingest and normalize a batch of Mandi price records with quality validation.
    """
    raw_dicts = [r.dict() for r in records]
    report = MandiIngestionService.ingest_records_batch(
        db=db,
        raw_records=raw_dicts,
        source_label="USER_INGESTION",
        user_id=current_user.id
    )
    return report

@router.post("/ingest-dataset", response_model=IngestionReportSchema)
def ingest_local_dataset(
    max_rows: int = Query(500, ge=10, le=5000),
    current_user: User = Depends(require_roles([UserRole.MINISTRY_ADMIN, UserRole.GOVT_AUDITOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Ingest historical market records from the repository's Agmarknet dataset.
    """
    csv_file = Path(__file__).resolve().parents[4] / "dataset" / "commodity_price.csv"
    if not csv_file.exists():
        csv_file = Path(__file__).resolve().parents[4] / "dataset" / "9ef84268-d588-465a-a308-a864a43d0070.csv"
    
    if not csv_file.exists():
        raise HTTPException(status_code=404, detail="Historical dataset CSV not found on server")

    report = MandiIngestionService.ingest_from_csv(
        db=db,
        csv_path=str(csv_file),
        max_rows=max_rows,
        user_id=current_user.id
    )
    return report

@router.get("/quality-summary", response_model=DataQualitySummarySchema)
def get_data_quality_scorecard(db: Session = Depends(get_db)):
    """
    Retrieve overarching data health, valid record counts, and anomaly metrics.
    """
    return MandiIngestionService.get_data_quality_summary(db)
