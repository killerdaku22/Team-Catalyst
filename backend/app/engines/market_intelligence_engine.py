import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MarketEventSchema(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=5, max_length=150)
    category: str = Field(..., description="WEATHER_SHOCK, SUPPLY_DISRUPTION, POLICY_INTERVENTION, HARVEST_GLUT, INFRASTRUCTURE_FAILURE")
    affected_region: str = Field(..., min_length=2, max_length=100)
    affected_commodities: List[str] = Field(..., min_items=1)
    severity: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    supply_impact_pct: float = Field(..., ge=-100.0, le=200.0, description="Negative for contraction, positive for glut")
    price_shock_multiplier: float = Field(..., gt=0.0, le=5.0, description="Multiplier on baseline price, e.g. 1.25 for +25%")
    source: str = Field("DoCA Market Intelligence Bureau", max_length=150)
    confidence_score: float = Field(default=0.90, ge=0.0, le=1.0)
    created_at: Optional[str] = None

class ShockSimulationRequest(BaseModel):
    commodity: str
    region: str
    baseline_modal_price: float = Field(..., gt=0)
    shock_event_title: str
    supply_contraction_pct: float = Field(default=20.0, ge=-90.0, le=200.0)
    elasticity_coefficient: float = Field(default=-0.65, description="Price elasticity of supply for agricultural commodities")

class ShockSimulationResult(BaseModel):
    commodity: str
    region: str
    baseline_modal_price: float
    simulated_shock_price: float
    price_change_amount: float
    price_change_pct: float
    supply_shortfall_estimate_tonnes: float
    recommended_intervention: str
    disruption_severity: str
    affected_stakeholders: List[str]

# In-memory store of active intelligence events
ACTIVE_INTELLIGENCE_EVENTS: List[Dict[str, Any]] = [
    {
        "id": "EVT-2026-0801",
        "title": "Unseasonal Heavy Monsoon Deluge across Nashik Onion Belt",
        "category": "WEATHER_SHOCK",
        "affected_region": "Maharashtra",
        "affected_commodities": ["Onion"],
        "severity": "HIGH",
        "supply_impact_pct": -28.0,
        "price_shock_multiplier": 1.34,
        "source": "IMD Agrometeorological Advisory (Simulation Baseline)",
        "confidence_score": 0.94,
        "created_at": "2026-08-25 09:30:00",
        "data_classification": "SEEDED_SIMULATION_SCENARIO",
        "provenance_source": "DoCA Market Shock Scenario Planning"
    },
    {
        "id": "EVT-2026-0802",
        "title": "Kolar Tomato APMC Truckers Strike & Transit Blockade",
        "category": "SUPPLY_DISRUPTION",
        "affected_region": "Karnataka",
        "affected_commodities": ["Tomato"],
        "severity": "MEDIUM",
        "supply_impact_pct": -20.0,
        "price_shock_multiplier": 1.22,
        "source": "State APMC Logistics Directorate (Simulation Baseline)",
        "confidence_score": 0.88,
        "created_at": "2026-08-26 14:15:00",
        "data_classification": "SEEDED_SIMULATION_SCENARIO",
        "provenance_source": "DoCA Market Shock Scenario Planning"
    },
    {
        "id": "EVT-2026-0803",
        "title": "Punjab Early Wheat Bumper Harvest Arrival Surge",
        "category": "HARVEST_GLUT",
        "affected_region": "Punjab",
        "affected_commodities": ["Wheat"],
        "severity": "LOW",
        "supply_impact_pct": 35.0,
        "price_shock_multiplier": 0.92,
        "source": "Punjab Mandi Board Statistics (Simulation Baseline)",
        "confidence_score": 0.91,
        "created_at": "2026-08-27 10:00:00",
        "data_classification": "SEEDED_SIMULATION_SCENARIO",
        "provenance_source": "DoCA Market Shock Scenario Planning"
    }
]

class MarketIntelligenceEngine:
    """
    Market Shock Analysis, Event Ingestion & What-If Simulation Engine.
    """

    @classmethod
    def get_active_events(cls, commodity: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        events = list(ACTIVE_INTELLIGENCE_EVENTS)
        if commodity:
            events = [e for e in events if any(commodity.lower() in c.lower() for c in e["affected_commodities"])]
        if region:
            events = [e for e in events if region.lower() in e["affected_region"].lower()]
        return events

    @classmethod
    def register_event(cls, event_in: MarketEventSchema) -> Dict[str, Any]:
        event_dict = event_in.dict()
        event_dict["id"] = f"EVT-2026-{uuid.uuid4().hex[:6].upper()}"
        event_dict["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        ACTIVE_INTELLIGENCE_EVENTS.insert(0, event_dict)
        return event_dict

    @classmethod
    def simulate_event_shock(cls, req: ShockSimulationRequest) -> ShockSimulationResult:
        P_base = req.baseline_modal_price
        supply_chg_pct = req.supply_contraction_pct
        elasticity = req.elasticity_coefficient # e.g. -0.65 -> % price change = -1 / elasticity * % supply change

        # Agricultural microeconomic shock formula:
        # % Δ Price ≈ - (1 / |Elasticity|) * % Δ Supply
        price_multiplier = 1.0 + (abs(supply_chg_pct / 100.0) / abs(elasticity)) if supply_chg_pct > 0 else 1.0 - (abs(supply_chg_pct / 100.0) * 0.5)
        P_simulated = round(P_base * price_multiplier, 2)
        price_diff = round(P_simulated - P_base, 2)
        price_diff_pct = round(((P_simulated - P_base) / P_base) * 100.0, 1)

        # Disruption severity
        if price_diff_pct > 30.0:
            severity = "CRITICAL"
            intervention = f"Release buffer stock from Central Warehouse reserves and activate direct rail transport to {req.region}."
        elif price_diff_pct > 15.0:
            severity = "HIGH"
            intervention = f"Incentivize neighboring FPO clusters to divert surplus {req.commodity} shipments to {req.region}."
        elif price_diff_pct > 0:
            severity = "MODERATE"
            intervention = "Monitor daily Mandi modal price movements; alert regional consumer cooperative networks."
        else:
            severity = "GLUT_CONTAINMENT"
            intervention = f"Open decentralized procurement centers and offer storage subsidies to prevent distressed selling below MSP."

        return ShockSimulationResult(
            commodity=req.commodity,
            region=req.region,
            baseline_modal_price=P_base,
            simulated_shock_price=P_simulated,
            price_change_amount=price_diff,
            price_change_pct=price_diff_pct,
            supply_shortfall_estimate_tonnes=round(abs(supply_chg_pct) * 12.5, 1),
            recommended_intervention=intervention,
            disruption_severity=severity,
            affected_stakeholders=["Farmers / FPOs", "Urban Consumers", "Cold Chain Transporters", "DoCA Price Stabilization Fund"]
        )
