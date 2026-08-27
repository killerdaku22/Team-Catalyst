from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.api.deps import require_roles
from app.engines.cold_storage_engine import (
    ColdStorageEngine,
    ColdStorageFacility,
    StorageChamberTelemetry,
    StorageBookingRequest,
    StorageBookingConfirmation
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/facilities", response_model=List[ColdStorageFacility])
def list_cold_storage_facilities(state: Optional[str] = Query(None, description="Filter by Indian State")):
    """List registered cold storage infrastructure facilities with real-time IoT chamber telemetry."""
    return ColdStorageEngine.list_facilities(state=state)

@router.get("/{facility_id}/telemetry", response_model=StorageChamberTelemetry)
def get_chamber_iot_telemetry(facility_id: str):
    """Retrieve real-time IoT sensor telemetry stream (temperature, humidity, ethylene, CO2, spoilage risk)."""
    try:
        return ColdStorageEngine.get_chamber_telemetry(facility_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/book", response_model=StorageBookingConfirmation)
def book_cold_storage_capacity(
    req: StorageBookingRequest,
    current_user: User = Depends(require_roles([UserRole.FPO_MANAGER, UserRole.FARMER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Reserve cold storage chamber capacity with integrated DoCA power subsidy benefits.
    """
    try:
        confirmation = ColdStorageEngine.book_storage_space(req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    AuditService.record_event(
        db=db,
        event_type="STORAGE_CAPACITY_BOOKED",
        action="BOOK",
        resource_type="cold_storage",
        user_id=current_user.id,
        resource_id=confirmation.booking_id,
        details={
            "facility": confirmation.facility_name,
            "commodity": req.commodity,
            "tonnes": req.quantity_tonnes,
            "net_fee_inr": confirmation.net_payable_fee_inr,
            "subsidy_inr": confirmation.doca_subsidy_amount_inr
        }
    )

    return confirmation
