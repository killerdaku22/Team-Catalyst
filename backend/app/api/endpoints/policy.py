from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.api.deps import require_roles
from app.engines.policy_simulation_engine import (
    PolicySimulationEngine,
    PolicyScenarioRequest,
    PolicyScenarioResult
)
from app.services.audit_service import AuditService

router = APIRouter()

PRESET_POLICY_SCENARIOS = [
    {
        "scenario_title": "Monsoon Rail Freight Subsidy (Operation Greens)",
        "policy_type": "FREIGHT_SUBSIDY",
        "target_commodity": "Tomato",
        "target_region": "Kolar to Delhi Corridor",
        "intervention_magnitude_pct": 30.0,
        "estimated_regional_volume_tonnes": 8000.0,
        "baseline_retail_price_per_kg": 42.0,
        "baseline_farmer_price_per_kg": 24.0
    },
    {
        "scenario_title": "Strategic Buffer Stock Release (Onion Price Stabilization)",
        "policy_type": "BUFFER_STOCK_RELEASE",
        "target_commodity": "Onion",
        "target_region": "National Capital Region (NCR)",
        "intervention_magnitude_pct": 25.0,
        "estimated_regional_volume_tonnes": 12000.0,
        "baseline_retail_price_per_kg": 38.0,
        "baseline_farmer_price_per_kg": 20.0
    },
    {
        "scenario_title": "Cold Storage Power Assistance during Summer Glut",
        "policy_type": "STORAGE_SUBSIDY",
        "target_commodity": "Potato",
        "target_region": "Agra-Aligarh Belt",
        "intervention_magnitude_pct": 50.0,
        "estimated_regional_volume_tonnes": 15000.0,
        "baseline_retail_price_per_kg": 22.0,
        "baseline_farmer_price_per_kg": 12.0
    }
]

@router.get("/presets", response_model=List[Dict[str, Any]])
def get_preset_policy_scenarios():
    """Retrieve pre-configured DoCA price stabilization and market subsidy scenarios."""
    return PRESET_POLICY_SCENARIOS

@router.post("/simulate", response_model=PolicyScenarioResult)
def simulate_policy_scenario(
    req: PolicyScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate macroeconomic welfare effects, fiscal budget outlays, and benefit-to-cost ratios of policy interventions.
    """
    result = PolicySimulationEngine.simulate_policy_intervention(req)

    # Record policy simulation audit event
    AuditService.record_event(
        db=db,
        event_type="POLICY_SCENARIO_SIMULATED",
        action="SIMULATE",
        resource_type="policy_engine",
        details={
            "scenario": req.scenario_title,
            "policy": req.policy_type,
            "commodity": req.target_commodity,
            "fiscal_outlay_inr": result.total_government_fiscal_outlay_inr,
            "bcr": result.benefit_cost_ratio
        }
    )

    return result
