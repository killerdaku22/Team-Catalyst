from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engines.decision_engine import (
    AgriculturalDecisionEngine,
    BatchDecisionRequestSchema,
    DecisionRecommendationResult
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/evaluate", response_model=DecisionRecommendationResult)
def evaluate_batch_decision(
    req: BatchDecisionRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Evaluate SELL_NOW, STORE, MOVE, and SPLIT economic optimization for a crop batch.
    """
    result = AgriculturalDecisionEngine.evaluate_batch_decision(req)

    # Record decision evaluation audit log
    AuditService.record_event(
        db=db,
        event_type="DECISION_OPTIMIZATION_EVALUATED",
        action="EVALUATE",
        resource_type="decision_engine",
        details={
            "commodity": req.commodity,
            "quantity_kg": req.quantity_kg,
            "optimal_action": result.optimal_action,
            "net_revenue": result.optimal_net_revenue,
            "uplift_pct": result.net_uplift_pct
        }
    )

    return result
