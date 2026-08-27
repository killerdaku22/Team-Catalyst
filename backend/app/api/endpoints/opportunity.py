from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engines.market_opportunity_engine import (
    MarketOpportunityEngine,
    MarketOpportunityRequestSchema,
    OpportunityRankingResult
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/best-markets", response_model=OpportunityRankingResult)
def get_best_market_opportunities(
    req: MarketOpportunityRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Evaluate and rank regional Mandis and institutional buyers by net realization after freight and spoilage costs.
    """
    result = MarketOpportunityEngine.rank_market_opportunities(req)

    # Record audit log
    AuditService.record_event(
        db=db,
        event_type="MARKET_OPPORTUNITY_RANKED",
        action="RANK",
        resource_type="opportunity_engine",
        details={
            "commodity": req.commodity,
            "origin": req.origin_location,
            "top_market": result.top_recommended_destination,
            "top_net_price": result.top_net_realization_per_kg,
            "max_uplift_pct": result.max_net_uplift_pct
        }
    )

    return result
