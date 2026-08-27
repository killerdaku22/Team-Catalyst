import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ContractCreateRequest(BaseModel):
    buyer_organization: str = Field(..., min_length=3, max_length=120)
    buyer_type: str = Field("INSTITUTIONAL_BUYER", description="INSTITUTIONAL_BUYER, FOOD_PROCESSOR, EXPORTER, COOPERATIVE")
    commodity: str
    target_grade: str = "Grade A"
    required_quantity_kg: float = Field(..., gt=0)
    offered_price_per_kg: float = Field(..., gt=0)
    delivery_destination_hub: str
    destination_latitude: float
    destination_longitude: float
    delivery_deadline: str
    max_moisture_pct: float = Field(default=12.0, ge=1.0, le=40.0)
    quality_specs: Dict[str, Any] = {}

class QualityInspectionReport(BaseModel):
    contract_id: str
    measured_moisture_pct: float
    grade_conformance: bool
    foreign_matter_pct: float
    damage_pct: float
    inspector_id: str
    inspection_notes: str

class SettlementBreakdown(BaseModel):
    contract_id: str
    gross_payout_inr: float
    quality_deductions_inr: float
    transit_delay_penalty_inr: float
    net_fpo_payout_inr: float
    disintermediation_savings_vs_mandi_inr: float
    status: str

class ProcurementContract(BaseModel):
    id: str
    buyer_organization: str
    buyer_type: str
    commodity: str
    target_grade: str
    required_quantity_kg: float
    offered_price_per_kg: float
    delivery_destination_hub: str
    destination_latitude: float
    destination_longitude: float
    delivery_deadline: str
    max_moisture_pct: float
    status: str # OPEN_FOR_BIDDING, FPO_COMMITTED, IN_TRANSIT, DELIVERED_PENDING_INSPECTION, SETTLED, CANCELLED
    assigned_fpo_id: Optional[int] = None
    assigned_fpo_name: Optional[str] = None
    created_at: str
    inspection_report: Optional[QualityInspectionReport] = None
    settlement: Optional[SettlementBreakdown] = None

# In-memory store for bulk institutional contracts
INSTITUTIONAL_CONTRACTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "CTR-2026-DEL-001",
        "buyer_organization": "BigBasket North Regional Sourcing",
        "buyer_type": "INSTITUTIONAL_BUYER",
        "commodity": "Tomato",
        "target_grade": "Grade A Fresh",
        "required_quantity_kg": 5000.0,
        "offered_price_per_kg": 34.0,
        "delivery_destination_hub": "BigBasket Manesar Central Hub",
        "destination_latitude": 28.3512,
        "destination_longitude": 76.9415,
        "delivery_deadline": "2026-09-05",
        "max_moisture_pct": 14.0,
        "status": "OPEN_FOR_BIDDING",
        "assigned_fpo_id": None,
        "assigned_fpo_name": None,
        "created_at": "2026-08-27 08:30:00"
    },
    {
        "id": "CTR-2026-MUM-002",
        "buyer_organization": "Reliance Fresh Maharashtra Sourcing",
        "buyer_type": "INSTITUTIONAL_BUYER",
        "commodity": "Onion",
        "target_grade": "Grade A Red",
        "required_quantity_kg": 8000.0,
        "offered_price_per_kg": 26.5,
        "delivery_destination_hub": "Reliance Vashi Distribution Center",
        "destination_latitude": 19.0760,
        "destination_longitude": 72.9986,
        "delivery_deadline": "2026-09-08",
        "max_moisture_pct": 11.0,
        "status": "OPEN_FOR_BIDDING",
        "assigned_fpo_id": None,
        "assigned_fpo_name": None,
        "created_at": "2026-08-27 09:15:00"
    },
    {
        "id": "CTR-2026-SAF-003",
        "buyer_organization": "Safal Mother Dairy Processing Unit",
        "buyer_type": "FOOD_PROCESSOR",
        "commodity": "Potato",
        "target_grade": "Processing Grade",
        "required_quantity_kg": 12000.0,
        "offered_price_per_kg": 18.2,
        "delivery_destination_hub": "Mother Dairy Mangolpuri Plant",
        "destination_latitude": 28.6922,
        "destination_longitude": 77.0855,
        "delivery_deadline": "2026-09-12",
        "max_moisture_pct": 12.0,
        "status": "OPEN_FOR_BIDDING",
        "assigned_fpo_id": None,
        "assigned_fpo_name": None,
        "created_at": "2026-08-27 11:00:00"
    }
]

class ProcurementContractEngine:
    """
    Direct Institutional Bulk Purchase Contracts & Legal Metrology Quality Inspection Engine.
    """

    @classmethod
    def list_open_contracts(cls, commodity: Optional[str] = None) -> List[Dict[str, Any]]:
        contracts = list(INSTITUTIONAL_CONTRACTS_STORE)
        if commodity:
            contracts = [c for c in contracts if commodity.lower() in c["commodity"].lower()]
        return contracts

    @classmethod
    def create_contract(cls, req: ContractCreateRequest) -> Dict[str, Any]:
        contract_dict = req.dict()
        contract_dict["id"] = f"CTR-2026-{uuid.uuid4().hex[:6].upper()}"
        contract_dict["status"] = "OPEN_FOR_BIDDING"
        contract_dict["assigned_fpo_id"] = None
        contract_dict["assigned_fpo_name"] = None
        contract_dict["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        INSTITUTIONAL_CONTRACTS_STORE.insert(0, contract_dict)
        return contract_dict

    @classmethod
    def commit_fpo_to_contract(cls, contract_id: str, fpo_id: int, fpo_name: str) -> Dict[str, Any]:
        contract = next((c for c in INSTITUTIONAL_CONTRACTS_STORE if c["id"] == contract_id), None)
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        if contract["status"] != "OPEN_FOR_BIDDING":
            raise ValueError(f"Contract {contract_id} is already in {contract['status']} status")

        contract["status"] = "FPO_COMMITTED"
        contract["assigned_fpo_id"] = fpo_id
        contract["assigned_fpo_name"] = fpo_name
        return contract

    @classmethod
    def submit_quality_inspection(cls, report: QualityInspectionReport) -> SettlementBreakdown:
        contract = next((c for c in INSTITUTIONAL_CONTRACTS_STORE if c["id"] == report.contract_id), None)
        if not contract:
            raise ValueError(f"Contract {report.contract_id} not found")

        contract["inspection_report"] = report.dict()
        contract["status"] = "SETTLED"

        Q = contract["required_quantity_kg"]
        P = contract["offered_price_per_kg"]
        gross_payout = round(Q * P, 2)

        # Quality Deductions Math
        deductions = 0.0
        if report.measured_moisture_pct > contract["max_moisture_pct"]:
            moisture_excess = report.measured_moisture_pct - contract["max_moisture_pct"]
            deductions += round(gross_payout * (moisture_excess * 0.015), 2)

        if report.foreign_matter_pct > 2.0:
            deductions += round(gross_payout * 0.02, 2)

        if not report.grade_conformance:
            deductions += round(gross_payout * 0.05, 2)

        transit_delay = 0.0
        net_payout = round(gross_payout - deductions - transit_delay, 2)
        # Disintermediation savings: compared to standard APMC mandi intermediary cut (8%)
        savings_vs_mandi = round(gross_payout * 0.08, 2)

        settlement = SettlementBreakdown(
            contract_id=report.contract_id,
            gross_payout_inr=gross_payout,
            quality_deductions_inr=deductions,
            transit_delay_penalty_inr=transit_delay,
            net_fpo_payout_inr=net_payout,
            disintermediation_savings_vs_mandi_inr=savings_vs_mandi,
            status="PAID_OUT"
        )
        contract["settlement"] = settlement.dict()
        return settlement
