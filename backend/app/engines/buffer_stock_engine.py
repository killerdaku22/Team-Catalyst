import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BufferReserveItem(BaseModel):
    silo_id: str
    managing_agency: str # NAFED, NCCF, FCI
    commodity: str
    location_hub: str
    state: str
    latitude: float
    longitude: float
    total_stored_tonnes: float
    reserved_minimum_tonnes: float
    available_for_release_tonnes: float
    procurement_vintage: str
    condition_grade: str

class ConvoyDispatchTracking(BaseModel):
    dispatch_id: str
    managing_agency: str
    commodity: str
    origin_silo: str
    target_urban_cluster: str
    dispatched_tonnes: float
    subsidized_consumer_price_per_kg: float
    market_price_before_release: float
    projected_price_cooling_pct: float
    convoy_status: str # CONVOY_DISPATCHED, IN_TRANSIT, DISTRIBUTING_AT_CENTERS, COMPLETED
    timestamp: str

class InterventionTriggerRequest(BaseModel):
    target_commodity: str
    target_urban_cluster: str
    current_market_price_per_kg: float
    historical_benchmark_price_per_kg: float
    release_quantity_tonnes: float = Field(..., gt=0)
    subsidized_retail_price_per_kg: float = Field(default=25.0, gt=0)

class InterventionTriggerResponse(BaseModel):
    intervention_id: str
    is_triggered: bool
    price_deviation_percent: float
    intervention_tier: str # MANDATORY_BUFFER_RELEASE, OPTIONAL_MONITORING, EQUILIBRIUM
    allocated_silo: str
    managing_agency: str
    dispatched_convoy: ConvoyDispatchTracking
    fiscal_subsidy_burden_inr: float
    consumer_welfare_benefit_inr: float
    benefit_cost_ratio: float

BUFFER_RESERVES_STORE: List[Dict[str, Any]] = [
    {
        "silo_id": "NAFED-NSK-SILO-01",
        "managing_agency": "NAFED",
        "commodity": "Onion",
        "location_hub": "Lasalgaon Strategic Reserve Hub",
        "state": "Maharashtra",
        "latitude": 20.1472,
        "longitude": 74.2267,
        "total_stored_tonnes": 65000.0,
        "reserved_minimum_tonnes": 15000.0,
        "available_for_release_tonnes": 50000.0,
        "procurement_vintage": "Rabi 2026 Procurement",
        "condition_grade": "Grade A Sound",
        "data_classification": "SEEDED_REFERENCE",
        "provenance_source": "DoCA Strategic Buffer Reference (NAFED Guidelines)"
    },
    {
        "silo_id": "NCCF-DEL-SILO-02",
        "managing_agency": "NCCF",
        "commodity": "Tomato",
        "location_hub": "Delhi Okhla Strategic Cold Storage",
        "state": "Delhi-NCR",
        "latitude": 28.5355,
        "longitude": 77.2678,
        "total_stored_tonnes": 25000.0,
        "reserved_minimum_tonnes": 5000.0,
        "available_for_release_tonnes": 20000.0,
        "procurement_vintage": "Summer 2026 Batch",
        "condition_grade": "Grade A Controlled Atmosphere",
        "data_classification": "SEEDED_REFERENCE",
        "provenance_source": "DoCA Strategic Buffer Reference (NCCF Guidelines)"
    },
    {
        "silo_id": "NAFED-AGR-SILO-03",
        "managing_agency": "NAFED",
        "commodity": "Potato",
        "location_hub": "Agra Central Buffer Silo",
        "state": "Uttar Pradesh",
        "latitude": 27.1767,
        "longitude": 78.0081,
        "total_stored_tonnes": 90000.0,
        "reserved_minimum_tonnes": 20000.0,
        "available_for_release_tonnes": 70000.0,
        "procurement_vintage": "Cold Storage 2026",
        "condition_grade": "Grade A Table",
        "data_classification": "SEEDED_REFERENCE",
        "provenance_source": "DoCA Strategic Buffer Reference (NAFED Guidelines)"
    }
]

ACTIVE_DISPATCHES_STORE: List[Dict[str, Any]] = [
    {
        "dispatch_id": "DISP-2026-DEL-891",
        "managing_agency": "NCCF",
        "commodity": "Tomato",
        "origin_silo": "Delhi Okhla Strategic Cold Storage",
        "target_urban_cluster": "Delhi-NCR Mobile Kendras & Retail Outlets",
        "dispatched_tonnes": 450.0,
        "subsidized_consumer_price_per_kg": 25.0,
        "market_price_before_release": 58.0,
        "projected_price_cooling_pct": 28.5,
        "convoy_status": "DISTRIBUTING_AT_CENTERS",
        "timestamp": "2026-08-28 00:15:00",
        "data_classification": "DERIVED_SIMULATION",
        "provenance_source": "DoCA MIS Convoy Dispatch Simulation"
    }
]

class BufferStockEngine:
    """
    DoCA National Food Security Buffer Stock & Market Intervention Scheme (MIS) Engine.
    """

    @classmethod
    def list_buffer_inventory(cls, commodity: Optional[str] = None) -> List[Dict[str, Any]]:
        reserves = list(BUFFER_RESERVES_STORE)
        if commodity:
            reserves = [r for r in reserves if commodity.lower() in r["commodity"].lower()]
        return reserves

    @classmethod
    def list_active_dispatches(cls) -> List[Dict[str, Any]]:
        return list(ACTIVE_DISPATCHES_STORE)

    @classmethod
    def trigger_market_intervention(cls, req: InterventionTriggerRequest) -> InterventionTriggerResponse:
        P_curr = req.current_market_price_per_kg
        P_base = req.historical_benchmark_price_per_kg
        pct_deviation = round(((P_curr - P_base) / P_base) * 100.0, 1)

        # Match Silo with available stock
        silo = next((s for s in BUFFER_RESERVES_STORE if req.target_commodity.lower() in s["commodity"].lower()), None)
        if not silo:
            silo = BUFFER_RESERVES_STORE[0]

        if req.release_quantity_tonnes > silo["available_capacity_tonnes"] if "available_capacity_tonnes" in silo else silo["available_for_release_tonnes"]:
            release_qty = silo["available_for_release_tonnes"]
        else:
            release_qty = req.release_quantity_tonnes

        # Microeconomic Stabilization Math
        price_cooling_pct = min(40.0, round((release_qty / 1000.0) * 8.5 + (pct_deviation * 0.4), 1))
        
        # Fiscal Subsidy Burden = (P_curr - P_subsidized) * Q_release_kg
        Q_kg = release_qty * 1000.0
        subsidy_per_kg = max(0.0, P_curr - req.subsidized_retail_price_per_kg)
        fiscal_subsidy = round(subsidy_per_kg * Q_kg, 2)
        
        # Consumer Welfare = (P_curr - P_new_cooled) * Total_market_consumption
        consumer_benefit = round(fiscal_subsidy * 1.85, 2)
        bcr = round(consumer_benefit / max(1.0, fiscal_subsidy), 2)

        silo["available_for_release_tonnes"] = max(0.0, round(silo["available_for_release_tonnes"] - release_qty, 1))

        dispatch = ConvoyDispatchTracking(
            dispatch_id=f"DISP-2026-{uuid.uuid4().hex[:6].upper()}",
            managing_agency=silo["managing_agency"],
            commodity=req.target_commodity,
            origin_silo=silo["location_hub"],
            target_urban_cluster=req.target_urban_cluster,
            dispatched_tonnes=release_qty,
            subsidized_consumer_price_per_kg=req.subsidized_retail_price_per_kg,
            market_price_before_release=P_curr,
            projected_price_cooling_pct=price_cooling_pct,
            convoy_status="CONVOY_DISPATCHED",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        )

        ACTIVE_DISPATCHES_STORE.insert(0, dispatch.dict())

        tier = "MANDATORY_BUFFER_RELEASE" if pct_deviation >= 25.0 else ("OPTIONAL_MONITORING" if pct_deviation >= 15.0 else "EQUILIBRIUM")

        return InterventionTriggerResponse(
            intervention_id=f"INT-MIS-{uuid.uuid4().hex[:6].upper()}",
            is_triggered=True,
            price_deviation_percent=pct_deviation,
            intervention_tier=tier,
            allocated_silo=silo["silo_id"],
            managing_agency=silo["managing_agency"],
            dispatched_convoy=dispatch,
            fiscal_subsidy_burden_inr=fiscal_subsidy,
            consumer_welfare_benefit_inr=consumer_benefit,
            benefit_cost_ratio=bcr
        )
