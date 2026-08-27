from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.engines.procurement_contract_engine import (
    ProcurementContractEngine,
    ContractCreateRequest,
    QualityInspectionReport,
    SettlementBreakdown,
    ProcurementContract
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("", response_model=List[ProcurementContract])
def list_procurement_contracts(
    commodity: Optional[str] = Query(None, description="Filter by crop/commodity")
):
    """Retrieve all active institutional bulk purchase contracts and guaranteed-offtake agreements."""
    return ProcurementContractEngine.list_open_contracts(commodity=commodity)

@router.post("/create", response_model=ProcurementContract)
def create_institutional_contract(
    req: ContractCreateRequest,
    current_user: User = Depends(require_roles([UserRole.BUYER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Publish a direct institutional procurement contract with legal metrology quality parameters.
    Authorized for verified Institutional Buyers (processors, retailers, exporters).
    """
    contract = ProcurementContractEngine.create_contract(req)

    # Record tamper-evident audit trail
    AuditService.record_event(
        db=db,
        event_type="CONTRACT_PUBLISHED",
        action="CREATE",
        resource_type="contract",
        user_id=current_user.id,
        resource_id=contract["id"],
        details={
            "buyer": req.buyer_organization,
            "commodity": req.commodity,
            "quantity_kg": req.required_quantity_kg,
            "price_per_kg": req.offered_price_per_kg
        }
    )

    return contract

@router.post("/{contract_id}/accept", response_model=ProcurementContract)
def accept_contract_fpo(
    contract_id: str,
    current_user: User = Depends(require_roles([UserRole.FPO_MANAGER, UserRole.FARMER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    FPO accepts and commits produce to a bulk procurement contract, locking in guaranteed pricing.
    """
    try:
        updated_contract = ProcurementContractEngine.commit_fpo_to_contract(
            contract_id=contract_id,
            fpo_id=current_user.id,
            fpo_name=current_user.full_name
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    AuditService.record_event(
        db=db,
        event_type="CONTRACT_ACCEPTED",
        action="COMMIT",
        resource_type="contract",
        user_id=current_user.id,
        resource_id=contract_id,
        details={"fpo_id": current_user.id, "fpo_name": current_user.full_name}
    )

    return updated_contract

@router.post("/{contract_id}/inspect-quality", response_model=SettlementBreakdown)
def inspect_and_settle_contract(
    contract_id: str,
    report: QualityInspectionReport,
    current_user: User = Depends(require_roles([UserRole.BUYER, UserRole.GOVT_AUDITOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Inspect delivered produce against legal metrology specs and generate final payment settlement.
    """
    report.contract_id = contract_id
    report.inspector_id = str(current_user.id)

    try:
        settlement = ProcurementContractEngine.submit_quality_inspection(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    AuditService.record_event(
        db=db,
        event_type="CONTRACT_SETTLED",
        action="SETTLE",
        resource_type="contract",
        user_id=current_user.id,
        resource_id=contract_id,
        details={
            "gross_inr": settlement.gross_payout_inr,
            "deductions_inr": settlement.quality_deductions_inr,
            "net_payout_inr": settlement.net_fpo_payout_inr,
            "savings_vs_mandi_inr": settlement.disintermediation_savings_vs_mandi_inr
        }
    )

    return settlement
