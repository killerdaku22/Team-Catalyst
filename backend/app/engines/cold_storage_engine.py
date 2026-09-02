import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class StorageChamberTelemetry(BaseModel):
    chamber_id: str
    temperature_celsius: float
    target_temperature_celsius: float
    relative_humidity_percent: float
    target_humidity_percent: float
    ethylene_ppm: float
    co2_ppm: float
    spoilage_risk_index_percent: float
    chamber_status: str # OPTIMAL, WARNING_ELEVATED_ETHYLENE, CRITICAL_TEMPERATURE_EXCURSION
    last_sensor_ping: str

class ColdStorageFacility(BaseModel):
    id: str
    name: str
    location: str
    state: str
    latitude: float
    longitude: float
    total_capacity_tonnes: float
    available_capacity_tonnes: float
    base_rate_per_kg_day: float # ₹/kg/day
    doca_subsidized_rate_per_kg_day: float # Under PMKSY / Operation Greens
    certifications: List[str] # WDRA Registered, FSSAI Certified, Solar-Powered
    telemetry: StorageChamberTelemetry

class StorageBookingRequest(BaseModel):
    facility_id: str
    fpo_name: str
    commodity: str
    quantity_tonnes: float = Field(..., gt=0)
    planned_duration_days: int = Field(..., ge=1, le=180)
    apply_doca_subsidy: bool = True

class StorageBookingConfirmation(BaseModel):
    booking_id: str
    facility_name: str
    fpo_name: str
    commodity: str
    allocated_quantity_tonnes: float
    gross_storage_fee_inr: float
    doca_subsidy_amount_inr: float
    net_payable_fee_inr: float
    booking_status: str
    estimated_shelf_life_extension_days: int

STORAGE_FACILITIES_STORE: List[Dict[str, Any]] = [
    {
        "id": "CS-KOL-01",
        "name": "Kolar Integrated Mega Cold Hub",
        "location": "Kolar Agri Logistics Park",
        "state": "Karnataka",
        "latitude": 13.1367,
        "longitude": 78.1292,
        "total_capacity_tonnes": 5000.0,
        "available_capacity_tonnes": 1850.0,
        "base_rate_per_kg_day": 0.08,
        "doca_subsidized_rate_per_kg_day": 0.045,
        "certifications": ["WDRA_REGISTERED", "SOLAR_ASSISTED", "FSSAI_GRADE_A"],
        "data_classification": "SEEDED_FACILITY_REFERENCE",
        "telemetry": {
            "chamber_id": "CH-KOL-01A",
            "temperature_celsius": 4.2,
            "target_temperature_celsius": 4.0,
            "relative_humidity_percent": 88.5,
            "target_humidity_percent": 90.0,
            "ethylene_ppm": 0.35,
            "co2_ppm": 620.0,
            "spoilage_risk_index_percent": 3.8,
            "chamber_status": "OPTIMAL",
            "last_sensor_ping": "2026-08-28 00:30:00",
            "data_classification": "SIMULATED_IOT_TELEMETRY",
            "telemetry_source": "WDRA Environmental Chamber Simulator"
        }
    },
    {
        "id": "CS-NSK-02",
        "name": "Nashik Agro Cold Chain Terminal",
        "location": "Pimpalgaon APMC Cluster",
        "state": "Maharashtra",
        "latitude": 20.0059,
        "longitude": 73.7898,
        "total_capacity_tonnes": 8000.0,
        "available_capacity_tonnes": 2400.0,
        "base_rate_per_kg_day": 0.075,
        "doca_subsidized_rate_per_kg_day": 0.042,
        "certifications": ["WDRA_REGISTERED", "NCDC_ASSISTED"],
        "data_classification": "SEEDED_FACILITY_REFERENCE",
        "telemetry": {
            "chamber_id": "CH-NSK-04B",
            "temperature_celsius": 2.1,
            "target_temperature_celsius": 2.0,
            "relative_humidity_percent": 72.0,
            "target_humidity_percent": 70.0,
            "ethylene_ppm": 1.85,
            "co2_ppm": 890.0,
            "spoilage_risk_index_percent": 8.4,
            "chamber_status": "OPTIMAL",
            "last_sensor_ping": "2026-08-28 00:31:00",
            "data_classification": "SIMULATED_IOT_TELEMETRY",
            "telemetry_source": "WDRA Environmental Chamber Simulator"
        }
    },
    {
        "id": "CS-AGR-03",
        "name": "Taj Agro Cold Logistics Hub",
        "location": "Khandari Agra",
        "state": "Uttar Pradesh",
        "latitude": 27.1767,
        "longitude": 78.0081,
        "total_capacity_tonnes": 12000.0,
        "available_capacity_tonnes": 4100.0,
        "base_rate_per_kg_day": 0.065,
        "doca_subsidized_rate_per_kg_day": 0.038,
        "certifications": ["WDRA_REGISTERED", "FSSAI_GRADE_A"],
        "data_classification": "SEEDED_FACILITY_REFERENCE",
        "telemetry": {
            "chamber_id": "CH-AGR-02C",
            "temperature_celsius": 7.8,
            "target_temperature_celsius": 4.0,
            "relative_humidity_percent": 94.0,
            "target_humidity_percent": 88.0,
            "ethylene_ppm": 4.20,
            "co2_ppm": 1420.0,
            "spoilage_risk_index_percent": 24.5,
            "chamber_status": "WARNING_ELEVATED_ETHYLENE",
            "last_sensor_ping": "2026-08-28 00:32:00",
            "data_classification": "SIMULATED_IOT_TELEMETRY",
            "telemetry_source": "WDRA Environmental Chamber Simulator"
        }
    }
]

class ColdStorageEngine:
    """
    IoT Cold Storage Telemetry & Spoilage Early Warning Risk Engine.
    """

    @classmethod
    def list_facilities(cls, state: Optional[str] = None) -> List[Dict[str, Any]]:
        facilities = list(STORAGE_FACILITIES_STORE)
        if state:
            facilities = [f for f in facilities if state.lower() in f["state"].lower()]
        return facilities

    @classmethod
    def get_chamber_telemetry(cls, facility_id: str) -> StorageChamberTelemetry:
        facility = next((f for f in STORAGE_FACILITIES_STORE if f["id"] == facility_id), None)
        if not facility:
            raise ValueError(f"Facility {facility_id} not found")

        # Compute dynamic spoilage risk index
        t = facility["telemetry"]
        temp_diff = abs(t["temperature_celsius"] - t["target_temperature_celsius"])
        hum_diff = abs(t["relative_humidity_percent"] - t["target_humidity_percent"])
        ethylene = t["ethylene_ppm"]

        risk_score = min(100.0, (temp_diff * 4.5) + (hum_diff * 0.8) + (ethylene * 3.2))
        t["spoilage_risk_index_percent"] = round(risk_score, 1)

        if risk_score > 30.0:
            t["chamber_status"] = "CRITICAL_TEMPERATURE_EXCURSION"
        elif risk_score > 15.0 or ethylene > 3.0:
            t["chamber_status"] = "WARNING_ELEVATED_ETHYLENE"
        else:
            t["chamber_status"] = "OPTIMAL"

        return StorageChamberTelemetry(**t)

    @classmethod
    def book_storage_space(cls, req: StorageBookingRequest) -> StorageBookingConfirmation:
        facility = next((f for f in STORAGE_FACILITIES_STORE if f["id"] == req.facility_id), None)
        if not facility:
            raise ValueError(f"Facility {req.facility_id} not found")

        if req.quantity_tonnes > facility["available_capacity_tonnes"]:
            raise ValueError(f"Requested {req.quantity_tonnes} tonnes exceeds available capacity ({facility['available_capacity_tonnes']} tonnes)")

        qty_kg = req.quantity_tonnes * 1000.0
        days = req.planned_duration_days
        base_rate = facility["base_rate_per_kg_day"]
        subsidized_rate = facility["doca_subsidized_rate_per_kg_day"]

        gross_fee = round(qty_kg * base_rate * days, 2)
        subsidy_amount = round(gross_fee - (qty_kg * subsidized_rate * days), 2) if req.apply_doca_subsidy else 0.0
        net_fee = round(gross_fee - subsidy_amount, 2)

        facility["available_capacity_tonnes"] = round(facility["available_capacity_tonnes"] - req.quantity_tonnes, 2)

        return StorageBookingConfirmation(
            booking_id=f"BKG-CS-{datetime.utcnow().strftime('%m%d%H%M%S')}",
            facility_name=facility["name"],
            fpo_name=req.fpo_name,
            commodity=req.commodity,
            allocated_quantity_tonnes=req.quantity_tonnes,
            gross_storage_fee_inr=gross_fee,
            doca_subsidy_amount_inr=subsidy_amount,
            net_payable_fee_inr=net_fee,
            booking_status="CONFIRMED_SPACE_LOCKED",
            estimated_shelf_life_extension_days=min(60, days * 2)
        )
