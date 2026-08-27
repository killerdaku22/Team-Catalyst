from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.api.deps import require_roles
from app.engines.market_intelligence_engine import (
    MarketIntelligenceEngine,
    MarketEventSchema,
    ShockSimulationRequest,
    ShockSimulationResult
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/active-events", response_model=List[MarketEventSchema])
def get_active_market_events(
    commodity: Optional[str] = Query(None, description="Filter by commodity"),
    region: Optional[str] = Query(None, description="Filter by region")
):
    """Retrieve verified active market disruptions, weather shocks, and supply gluts."""
    return MarketIntelligenceEngine.get_active_events(commodity=commodity, region=region)

@router.post("/report-event", response_model=MarketEventSchema)
def report_market_intelligence_event(
    event_in: MarketEventSchema,
    current_user: User = Depends(require_roles([UserRole.MINISTRY_ADMIN, UserRole.GOVT_AUDITOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Log and broadcast a verified market disruption event across regional corridors.
    Authorized for Government Policy Administrators and Auditors.
    """
    created_event = MarketIntelligenceEngine.register_event(event_in)

    # Record tamper-evident audit log
    AuditService.record_event(
        db=db,
        event_type="INTELLIGENCE_EVENT_REGISTERED",
        action="BROADCAST",
        resource_type="market_event",
        user_id=current_user.id,
        resource_id=created_event["id"],
        details={
            "title": created_event["title"],
            "region": created_event["affected_region"],
            "severity": created_event["severity"],
            "price_shock_multiplier": created_event["price_shock_multiplier"]
        }
    )

    return created_event

@router.post("/simulate-shock", response_model=ShockSimulationResult)
def simulate_market_shock(req: ShockSimulationRequest):
    """
    Simulate macroeconomic supply shocks, harvest gluts, and price elasticity interventions.
    """
    return MarketIntelligenceEngine.simulate_event_shock(req)
