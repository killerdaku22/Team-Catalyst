import pytest
from app.engines.logistics_engine import (
    LogisticsOptimizationEngine,
    RouteOptimizationRequest,
    PickupStopSchema,
    DestinationHubSchema
)

def test_overload_prevention_on_single_oversized_pickup():
    """
    SCENARIO A: Verify that a single 12,000 kg pickup on a 10,000 kg vehicle
    is strictly bounded to 10,000 kg (100% utilization) and the 2,000 kg excess
    is preserved in unassigned_pickups rather than overloaded or dropped.
    """
    req = RouteOptimizationRequest(
        pickups=[
            PickupStopSchema(fpo_name="Mega Grower FPO", crop_name="Wheat", quantity_kg=12000.0, latitude=28.5, longitude=77.1)
        ],
        destination=DestinationHubSchema(name="Delhi Terminal", latitude=28.6139, longitude=77.2090),
        max_vehicle_capacity_kg=10000.0
    )
    result = LogisticsOptimizationEngine.optimize_pooled_route(req)

    # Invariant 1: Physical Capacity Bound
    assert result.total_weight_kg == 10000.0
    assert result.vehicle_capacity_utilization_percent == 100.0
    assert result.total_weight_kg <= 10000.0

    # Invariant 2: Quantity Conservation
    assert len(result.unassigned_pickups) == 1
    assert result.unassigned_pickups[0]["quantity_kg"] == 2000.0
    assert result.total_input_kg == 12000.0
    assert result.total_dispatched_kg + result.total_unassigned_kg == result.total_input_kg

def test_multi_vehicle_fleet_planning_and_quantity_conservation():
    """
    SCENARIO E & F: Verify that a multi-farmer pool (Farmer A=4000kg, B=3500kg, C=4500kg = 12,000kg)
    is distributed across a multi-vehicle fleet without losing farmer volume or overloading vehicles.
    """
    pickups = [
        {"fpo_name": "Farmer A", "crop_name": "Wheat", "quantity_kg": 4000.0, "latitude": 28.5, "longitude": 77.1},
        {"fpo_name": "Farmer B", "crop_name": "Wheat", "quantity_kg": 3500.0, "latitude": 28.6, "longitude": 77.2},
        {"fpo_name": "Farmer C", "crop_name": "Wheat", "quantity_kg": 4500.0, "latitude": 28.7, "longitude": 77.3}
    ]
    dest = {"name": "Delhi Terminal", "latitude": 28.6139, "longitude": 77.2090}

    fleet_plan = LogisticsOptimizationEngine.plan_multi_vehicle_fleet(
        pickups=pickups,
        destination=dest,
        max_vehicle_capacity_kg=10000.0,
        cost_per_km_freight_inr=28.0
    )

    assert fleet_plan["fleet_size"] == 2
    assert fleet_plan["total_input_kg"] == 12000.0
    assert fleet_plan["total_dispatched_kg"] == 12000.0
    assert fleet_plan["quantity_conservation_verified"] is True

    # Check vehicle loads
    veh1 = fleet_plan["fleet_vehicles"][0]
    veh2 = fleet_plan["fleet_vehicles"][1]
    veh1_wt = veh1["total_weight_kg"] if isinstance(veh1, dict) else veh1.total_weight_kg
    veh2_wt = veh2["total_weight_kg"] if isinstance(veh2, dict) else veh2.total_weight_kg
    assert veh1_wt <= 10000.0
    assert veh2_wt <= 10000.0
    assert veh1_wt + veh2_wt == 12000.0

def test_detour_marginal_economic_rejection():
    """
    SCENARIO D: Verify that an extreme detour stop (e.g. +195 km for 800 kg produce)
    is economically rejected when detour freight per kg exceeds the economic threshold.
    """
    pickups = [
        {"fpo_name": "Base FPO", "crop_name": "Tomato", "quantity_kg": 4000.0, "latitude": 28.5, "longitude": 77.1},
        {"fpo_name": "Far Detour FPO", "crop_name": "Tomato", "quantity_kg": 800.0, "latitude": 27.8, "longitude": 77.8} # Massive detour
    ]
    dest = {"name": "Delhi Hub", "latitude": 28.6139, "longitude": 77.2090}

    res = LogisticsOptimizationEngine.optimize_pooled_route(
        pickups=pickups,
        destination=dest,
        max_vehicle_capacity_kg=5000.0,
        cost_per_km_freight_inr=28.0
    )

    # Primary vehicle should only take the base load
    total_wt = res["total_weight_kg"] if isinstance(res, dict) else res.total_weight_kg
    unassigned = res["unassigned_pickups"] if isinstance(res, dict) else res.unassigned_pickups
    assert total_wt == 4000.0
    assert len(unassigned) == 1
    assert unassigned[0]["reason"] == "DETOUR_FREIGHT_EXCEEDS_ECONOMIC_TOLERANCE"

def test_commodity_compatibility_classification():
    """
    SCENARIO I: Verify commodity temperature/handling compatibility logic.
    """
    assert LogisticsOptimizationEngine.check_crop_compatibility("Tomato", "Capsicum") is True
    assert LogisticsOptimizationEngine.check_crop_compatibility("Potato", "Onion") is True
    assert LogisticsOptimizationEngine.check_crop_compatibility("Tomato", "Potato") is False

def test_integrated_dispatch_viability_status():
    """
    SCENARIO B & H: Verify integrated dispatch viability status is attached to route results.
    """
    req = RouteOptimizationRequest(
        pickups=[
            PickupStopSchema(fpo_name="FPO 1", crop_name="Tomato", quantity_kg=4000.0, latitude=28.5, longitude=77.1)
        ],
        destination=DestinationHubSchema(name="Delhi Hub", latitude=28.6139, longitude=77.2090),
        max_vehicle_capacity_kg=5000.0
    )
    result = LogisticsOptimizationEngine.optimize_pooled_route(req)

    assert result.dispatch_status == "DISPATCH_NOW"
    assert result.dispatch_viability is not None
    assert result.dispatch_viability["is_viable_to_dispatch_now"] is True
    assert result.vehicle_capacity_utilization_percent == 80.0
