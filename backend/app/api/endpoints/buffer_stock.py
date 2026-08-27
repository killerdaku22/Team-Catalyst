from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.api.deps import require_roles
from app.engines.buffer_stock_engine import (
    BufferStockEngine,
    BufferReserveItem,
    ConvoyDispatchTracking,
    InterventionTriggerRequest,
    InterventionTriggerResponse
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/inventory", response_model=List[BufferReserveItem])
def list_buffer_inventory(commodity: Optional[str] = Query(None, description="Filter by crop")):
    """List national strategic food security buffer reserves (NAFED, NCCF, FCI)."""
    return BufferStockEngine.list_buffer_inventory(commodity=commodity)

@router.get("/active-dispatches", response_model=List[ConvoyDispatchTracking])
def list_active_convoys():
    """Retrieve real-time tracking of subsidized food security market intervention convoys."""
    return BufferStockEngine.list_active_dispatches()

@router.post("/trigger-intervention", response_model=InterventionTriggerResponse)
def trigger_market_intervention(
    req: InterventionTriggerRequest,
    current_user: User = Depends(require_roles([UserRole.GOVT_AUDITOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    DoCA official triggers Market Intervention Scheme (MIS) buffer release to stabilize retail prices.
    """
    res = BufferStockEngine.trigger_market_intervention(req)

    AuditService.record_event(
        db=db,
        event_type="BUFFER_INTERVENTION_TRIGGERED",
        action="DISPATCH",
        resource_type="buffer_reserve",
        user_id=current_user.id,
        resource_id=res.intervention_id,
        details={
            "commodity": req.target_commodity,
            "urban_cluster": req.target_urban_cluster,
            "tonnes": req.release_quantity_tonnes,
            "price_cooling_pct": res.dispatched_convoy.projected_price_cooling_pct,
            "subsidy_burden_inr": res.fiscal_subsidy_burden_inr,
            "bcr": res.benefit_cost_ratio
        }
    )

    return res
