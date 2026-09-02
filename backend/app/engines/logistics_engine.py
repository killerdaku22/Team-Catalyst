import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PickupStopSchema(BaseModel):
    id: Optional[int] = None
    fpo_name: str
    crop_name: str
    quantity_kg: float = Field(..., gt=0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    shelf_life_days: Optional[int] = 14

class DestinationHubSchema(BaseModel):
    name: str = "Central Delhi Consumer Distribution Hub"
    latitude: float = 28.6139
    longitude: float = 77.2090

class RouteOptimizationRequest(BaseModel):
    pickups: List[PickupStopSchema]
    destination: DestinationHubSchema = DestinationHubSchema()
    max_vehicle_capacity_kg: float = Field(default=5000.0, gt=0)
    cost_per_km_freight_inr: float = Field(default=28.0, gt=0)

class FPOCostAllocation(BaseModel):
    fpo_name: str
    crop_name: str
    quantity_kg: float
    unpooled_freight_cost_inr: float
    pooled_freight_cost_inr: float
    freight_savings_inr: float
    savings_percent: float

class OptimizedRouteResult(BaseModel):
    route_waypoints: List[Dict[str, Any]]
    stops_count: int
    total_weight_kg: float
    vehicle_capacity_utilization_percent: float
    total_distance_km: float
    estimated_time_hours: float
    distance_saved_vs_unpooled_km: float
    co2_saved_kg: float
    spoilage_risk_percent: float
    total_trip_freight_cost_inr: float
    fpo_cost_allocations: List[FPOCostAllocation]
    # PR-15 Load Consolidation & Dynamic Dispatch Fields
    vehicle_id: Optional[str] = "VEH-01"
    dispatch_status: Optional[str] = "DISPATCH_NOW"
    total_input_kg: Optional[float] = None
    total_dispatched_kg: Optional[float] = None
    total_unassigned_kg: Optional[float] = 0.0
    unassigned_pickups: Optional[List[Dict[str, Any]]] = []
    dispatch_viability: Optional[Dict[str, Any]] = None
    fleet_vehicles_required: Optional[int] = 1

    def __getitem__(self, item):
        return getattr(self, item)

# Commodity temperature and handling compatibility groupings
CROP_COMPATIBILITY_CATEGORIES: Dict[str, str] = {
    "Tomato": "CHILLED_PERISHABLE",
    "Capsicum": "CHILLED_PERISHABLE",
    "Spinach": "CHILLED_PERISHABLE",
    "Strawberry": "CHILLED_PERISHABLE",
    "Potato": "AMBIENT_ROOT",
    "Onion": "AMBIENT_ROOT",
    "Wheat": "DRY_GRAIN",
    "Rice": "DRY_GRAIN",
    "Paddy": "DRY_GRAIN",
    "Produce": "GENERAL_AGRI"
}

class LogisticsOptimizationEngine:
    """
    Smart Multi-Stop Logistics & Pooling Engine for SIH26033.
    Solves Capacitated Vehicle Routing Problem (CVRP) with Nearest-Neighbor + 2-Opt heuristic,
    multi-vehicle fleet sizing, and dynamic dispatch viability evaluation.
    """

    @classmethod
    def check_crop_compatibility(cls, crop_a: str, crop_b: str) -> bool:
        """Determines if two produce types can share an unpartitioned cargo chamber."""
        cat_a = CROP_COMPATIBILITY_CATEGORIES.get(crop_a, "GENERAL_AGRI")
        cat_b = CROP_COMPATIBILITY_CATEGORIES.get(crop_b, "GENERAL_AGRI")
        if cat_a == "GENERAL_AGRI" or cat_b == "GENERAL_AGRI":
            return True
        return cat_a == cat_b

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between two points in km using Haversine formula."""
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 2)

    @classmethod
    def two_opt_optimize(cls, stops: List[Dict[str, Any]], dest: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Applies 2-opt edge swap heuristic to untangle route crossings."""
        if len(stops) <= 2:
            return stops

        best_route = list(stops)
        improved = True
        iterations = 0

        def route_dist(r):
            d = 0.0
            for i in range(len(r) - 1):
                d += cls.haversine_distance(r[i]["latitude"], r[i]["longitude"], r[i+1]["latitude"], r[i+1]["longitude"])
            d += cls.haversine_distance(r[-1]["latitude"], r[-1]["longitude"], dest["latitude"], dest["longitude"])
            return d

        best_dist = route_dist(best_route)

        while improved and iterations < 50:
            improved = False
            iterations += 1
            for i in range(len(best_route) - 1):
                for j in range(i + 1, len(best_route)):
                    new_route = best_route[:i] + best_route[i:j+1][::-1] + best_route[j+1:]
                    new_dist = route_dist(new_route)
                    if new_dist < best_dist - 0.05:
                        best_route = new_route
                        best_dist = new_dist
                        improved = True
                        break
                if improved:
                    break

        return best_route

    @classmethod
    def optimize_pooled_route(
        cls,
        req: Optional[RouteOptimizationRequest] = None,
        pickups: Optional[List[Dict[str, Any]]] = None,
        destination: Optional[Dict[str, Any]] = None,
        max_vehicle_capacity_kg: float = 5000.0,
        cost_per_km_freight_inr: float = 28.0
    ) -> Any:
        if req is not None:
            pickups_in = req.pickups
            dest_in = req.destination.dict() if hasattr(req.destination, 'dict') else req.destination
            max_cap = req.max_vehicle_capacity_kg
            rate_per_km = req.cost_per_km_freight_inr
            is_pydantic_req = True
        else:
            pickups_in = pickups or []
            dest_in = destination or {"name": "Central Delhi Hub", "latitude": 28.6139, "longitude": 77.2090}
            max_cap = max_vehicle_capacity_kg
            rate_per_km = cost_per_km_freight_inr
            is_pydantic_req = False

        if not pickups_in:
            empty_res = {
                "route_waypoints": [],
                "stops_count": 0,
                "total_weight_kg": 0.0,
                "vehicle_capacity_utilization_percent": 0.0,
                "total_distance_km": 0.0,
                "estimated_time_hours": 0.0,
                "distance_saved_vs_unpooled_km": 0.0,
                "co2_saved_kg": 0.0,
                "spoilage_risk_percent": 0.0,
                "total_trip_freight_cost_inr": 0.0,
                "fpo_cost_allocations": []
            }
            return OptimizedRouteResult(**empty_res) if is_pydantic_req else empty_res

        # Total Input Quantity Calculation for Strict Conservation Auditing
        total_input_kg = round(sum(
            float(p.get("quantity_kg", 500.0) if isinstance(p, dict) else getattr(p, "quantity_kg", 500.0))
            for p in pickups_in
        ), 1)

        # Capacity Bounding & Detour Economic Filter
        current_load = 0.0
        selected_pickups: List[Dict[str, Any]] = []
        unassigned_pickups: List[Dict[str, Any]] = []

        for p in pickups_in:
            p_dict = p.dict() if hasattr(p, 'dict') else dict(p)
            p_weight = float(p_dict.get("quantity_kg", 500.0))

            # Detour Economic Validation
            if selected_pickups and p_weight < 1500.0:
                prev_stop = selected_pickups[-1]
                direct_km = cls.haversine_distance(prev_stop["latitude"], prev_stop["longitude"], dest_in["latitude"], dest_in["longitude"])
                detour_km = (cls.haversine_distance(prev_stop["latitude"], prev_stop["longitude"], p_dict["latitude"], p_dict["longitude"]) +
                             cls.haversine_distance(p_dict["latitude"], p_dict["longitude"], dest_in["latitude"], dest_in["longitude"]))
                added_km = max(0.0, detour_km - direct_km)
                incremental_cost = added_km * rate_per_km
                cost_per_kg_detour = incremental_cost / p_weight if p_weight > 0 else 0.0
                
                # If detour freight cost > ₹6.0/kg and added distance > 50km, detour is economically prohibitive
                if added_km > 50.0 and cost_per_kg_detour > 6.0:
                    unassigned_copy = dict(p_dict)
                    unassigned_copy["reason"] = "DETOUR_FREIGHT_EXCEEDS_ECONOMIC_TOLERANCE"
                    unassigned_pickups.append(unassigned_copy)
                    continue

            # Capacity Invariant Check: Never exceed max_cap
            if current_load + p_weight <= max_cap:
                current_load += p_weight
                selected_pickups.append(p_dict)
            elif current_load < max_cap:
                # Partial allocation: Fill vehicle to 100% and preserve remainder
                available_space = round(max_cap - current_load, 1)
                if available_space > 0:
                    accepted_part = dict(p_dict)
                    accepted_part["quantity_kg"] = available_space
                    selected_pickups.append(accepted_part)

                    remainder_part = dict(p_dict)
                    remainder_part["quantity_kg"] = round(p_weight - available_space, 1)
                    remainder_part["reason"] = "PARTIAL_DISPATCH_REMAINDER_QUEUED"
                    unassigned_pickups.append(remainder_part)
                    current_load = max_cap
            else:
                # Vehicle full: queue remaining shipment without dropping
                unassigned_copy = dict(p_dict)
                unassigned_copy["reason"] = "EXCEEDS_SINGLE_VEHICLE_CAPACITY_QUEUED"
                unassigned_pickups.append(unassigned_copy)

        # Fallback safety: If single stop is submitted, bound it to max_cap
        if not selected_pickups and pickups_in:
            first_p = pickups_in[0]
            first_dict = first_p.dict() if hasattr(first_p, 'dict') else dict(first_p)
            first_weight = float(first_dict.get("quantity_kg", 500.0))
            if first_weight > max_cap:
                first_copy = dict(first_dict)
                first_copy["quantity_kg"] = max_cap
                selected_pickups.append(first_copy)
                current_load = max_cap

                rem_copy = dict(first_dict)
                rem_copy["quantity_kg"] = round(first_weight - max_cap, 1)
                rem_copy["reason"] = "OVERSIZED_BATCH_SPLIT_FOR_SECONDARY_VEHICLE"
                unassigned_pickups.append(rem_copy)
            else:
                selected_pickups.append(first_dict)
                current_load = first_weight

        # Nearest-Neighbor Initial Route
        unvisited = list(selected_pickups)
        current_loc = unvisited.pop(0)
        ordered_pickups = [current_loc]

        while unvisited:
            curr_lat, curr_lng = float(current_loc["latitude"]), float(current_loc["longitude"])
            nearest_idx = 0
            min_dist = float("inf")
            for idx, item in enumerate(unvisited):
                dist = cls.haversine_distance(curr_lat, curr_lng, float(item["latitude"]), float(item["longitude"]))
                if dist < min_dist:
                    min_dist = dist
                    nearest_idx = idx
            nearest_stop = unvisited.pop(nearest_idx)
            ordered_pickups.append(nearest_stop)
            current_loc = nearest_stop

        # 2-Opt Heuristic Refinement
        refined_pickups = cls.two_opt_optimize(ordered_pickups, dest_in)

        # Build Full Waypoint Sequence
        optimized_waypoints = []
        total_distance = 0.0

        for i, stop in enumerate(refined_pickups):
            stop_copy = dict(stop)
            stop_copy["type"] = "PICKUP"
            stop_copy["stop_sequence"] = i + 1
            optimized_waypoints.append(stop_copy)
            if i > 0:
                prev = refined_pickups[i - 1]
                total_distance += cls.haversine_distance(prev["latitude"], prev["longitude"], stop["latitude"], stop["longitude"])

        # Final destination leg
        last_stop = refined_pickups[-1]
        final_leg = cls.haversine_distance(last_stop["latitude"], last_stop["longitude"], dest_in["latitude"], dest_in["longitude"])
        total_distance += final_leg

        optimized_waypoints.append({
            "name": dest_in.get("name", "Urban Consumer Distribution Hub"),
            "latitude": dest_in["latitude"],
            "longitude": dest_in["longitude"],
            "type": "DESTINATION_HUB",
            "stop_sequence": len(refined_pickups) + 1
        })

        # Transit Duration & Spoilage
        est_hours = round(total_distance / 45.0, 2)
        spoilage_risk_pct = min(12.0, round(1.2 + (est_hours * 0.35), 1))

        # Unpooled Distance Calculation
        unpooled_distance = sum(
            cls.haversine_distance(float(p["latitude"]), float(p["longitude"]), dest_in["latitude"], dest_in["longitude"])
            for p in selected_pickups
        )
        distance_saved = max(0.0, round(unpooled_distance - total_distance, 2)) if len(selected_pickups) > 1 else 0.0

        # Carbon Reduction: 0.218 kg CO2 per km saved (medium commercial freight)
        co2_saved = round(distance_saved * 0.218, 2)

        # Freight Cost & Pro-Rata Allocations
        total_trip_cost = round(total_distance * rate_per_km, 2)
        allocations: List[FPOCostAllocation] = []

        for p in selected_pickups:
            q_fpo = float(p.get("quantity_kg", 500.0))
            solo_dist = cls.haversine_distance(float(p["latitude"]), float(p["longitude"]), dest_in["latitude"], dest_in["longitude"])
            solo_cost = round(solo_dist * rate_per_km, 2)
            # Pro-rata weight share of total trip cost
            pooled_cost = round((q_fpo / current_load) * total_trip_cost, 2) if current_load > 0 else solo_cost
            savings = round(solo_cost - pooled_cost, 2)
            savings_pct = round((savings / solo_cost) * 100.0, 1) if solo_cost > 0 else 0.0

            allocations.append(FPOCostAllocation(
                fpo_name=p.get("fpo_name", "Agri FPO"),
                crop_name=p.get("crop_name", "Produce"),
                quantity_kg=q_fpo,
                unpooled_freight_cost_inr=solo_cost,
                pooled_freight_cost_inr=pooled_cost,
                freight_savings_inr=savings,
                savings_percent=savings_pct
            ))

        # Integrated Dispatch Viability Evaluation
        viability = cls.evaluate_dispatch_timing(
            current_load_kg=current_load,
            max_capacity_kg=max_cap,
            total_trip_cost_inr=total_trip_cost,
            crop_price_per_kg=25.0,
            daily_spoilage_rate=0.005,
            storage_rate_per_day=0.08,
            expected_wait_days=2,
            expected_additional_volume_kg=max(0.0, max_cap - current_load)
        )
        dispatch_status = viability.get("recommended_action", "DISPATCH_NOW")

        total_unassigned = round(sum(float(u.get("quantity_kg", 0.0)) for u in unassigned_pickups), 1)
        fleet_req = max(1, math.ceil(total_input_kg / max_cap)) if max_cap > 0 else 1

        res = OptimizedRouteResult(
            route_waypoints=optimized_waypoints,
            stops_count=len(optimized_waypoints),
            total_weight_kg=round(current_load, 1),
            vehicle_capacity_utilization_percent=round((current_load / max_cap) * 100.0, 1),
            total_distance_km=round(total_distance, 2),
            estimated_time_hours=est_hours,
            distance_saved_vs_unpooled_km=distance_saved,
            co2_saved_kg=co2_saved,
            spoilage_risk_percent=spoilage_risk_pct,
            total_trip_freight_cost_inr=total_trip_cost,
            fpo_cost_allocations=allocations,
            vehicle_id="VEH-01",
            dispatch_status=dispatch_status,
            total_input_kg=total_input_kg,
            total_dispatched_kg=round(current_load, 1),
            total_unassigned_kg=total_unassigned,
            unassigned_pickups=unassigned_pickups,
            dispatch_viability=viability,
            fleet_vehicles_required=fleet_req
        )
        return res if is_pydantic_req else res.dict()

    @classmethod
    def evaluate_dispatch_timing(
        cls,
        current_load_kg: float,
        max_capacity_kg: float,
        total_trip_cost_inr: float,
        crop_price_per_kg: float,
        daily_spoilage_rate: float = 0.005,
        storage_rate_per_day: float = 0.08,
        expected_wait_days: int = 2,
        expected_additional_volume_kg: float = 2000.0
    ) -> Dict[str, Any]:
        """
        Evaluates whether immediate partial-load dispatch is economically superior
        to waiting for additional pooled volume, balancing freight reduction against
        holding spoilage and storage degradation.
        """
        if current_load_kg <= 0:
            return {"recommended_action": "HOLD_EMPTY", "is_viable_to_dispatch_now": False}

        current_freight_per_kg = total_trip_cost_inr / current_load_kg
        projected_total_load = min(max_capacity_kg, current_load_kg + expected_additional_volume_kg)
        projected_freight_per_kg = total_trip_cost_inr / projected_total_load if projected_total_load > 0 else current_freight_per_kg

        # Marginal freight savings if waiting
        marginal_freight_savings_per_kg = max(0.0, current_freight_per_kg - projected_freight_per_kg)
        total_freight_savings_waiting = current_load_kg * marginal_freight_savings_per_kg

        # Marginal degradation and holding cost if waiting
        spoilage_loss_waiting = current_load_kg * crop_price_per_kg * (daily_spoilage_rate * expected_wait_days)
        storage_cost_waiting = current_load_kg * storage_rate_per_day * expected_wait_days
        total_degradation_loss_waiting = spoilage_loss_waiting + storage_cost_waiting

        net_waiting_benefit = total_freight_savings_waiting - total_degradation_loss_waiting
        dispatch_now_optimal = net_waiting_benefit <= 0.0 or (current_load_kg / max_capacity_kg) >= 0.85

        action = "DISPATCH_NOW" if dispatch_now_optimal else "WAIT_FOR_POOLING"
        
        return {
            "recommended_action": action,
            "is_viable_to_dispatch_now": dispatch_now_optimal,
            "current_capacity_utilization_pct": round((current_load_kg / max_capacity_kg) * 100.0, 1),
            "current_freight_per_kg": round(current_freight_per_kg, 2),
            "projected_freight_if_waiting_per_kg": round(projected_freight_per_kg, 2),
            "projected_freight_savings_waiting_inr": round(total_freight_savings_waiting, 2),
            "projected_spoilage_and_storage_cost_waiting_inr": round(total_degradation_loss_waiting, 2),
            "net_waiting_payoff_inr": round(net_waiting_benefit, 2),
            "economic_rationale": (
                f"Immediate dispatch optimal: Spoilage & holding loss (₹{round(total_degradation_loss_waiting, 2)}) exceeds freight savings from waiting."
                if dispatch_now_optimal else
                f"Waiting {expected_wait_days} days for +{expected_additional_volume_kg}kg saves ₹{round(total_freight_savings_waiting, 2)} in freight, exceeding holding costs."
            )
        }

    @classmethod
    def plan_multi_vehicle_fleet(
        cls,
        pickups: List[Dict[str, Any]],
        destination: Dict[str, Any],
        max_vehicle_capacity_kg: float = 10000.0,
        cost_per_km_freight_inr: float = 28.0
    ) -> Dict[str, Any]:
        """
        Solves multi-vehicle CVRP bin-packing across a fleet when total pooled
        supply exceeds single-vehicle payload, guaranteeing 100% quantity conservation.
        """
        if not pickups:
            return {"fleet_size": 0, "total_input_kg": 0.0, "total_dispatched_kg": 0.0, "quantity_conservation_verified": True, "fleet_vehicles": []}

        total_input_kg = sum(float(p.get("quantity_kg", 500.0)) for p in pickups)
        remaining_pool = [dict(p) for p in pickups]
        fleet_routes: List[Any] = []
        veh_counter = 1

        while remaining_pool:
            current_bin: List[Dict[str, Any]] = []
            bin_weight = 0.0
            unpacked: List[Dict[str, Any]] = []

            for p in remaining_pool:
                p_weight = float(p.get("quantity_kg", 500.0))
                if bin_weight + p_weight <= max_vehicle_capacity_kg:
                    bin_weight += p_weight
                    current_bin.append(p)
                elif bin_weight < max_vehicle_capacity_kg:
                    available = round(max_vehicle_capacity_kg - bin_weight, 1)
                    if available > 0:
                        part_a = dict(p)
                        part_a["quantity_kg"] = available
                        current_bin.append(part_a)

                        part_b = dict(p)
                        part_b["quantity_kg"] = round(p_weight - available, 1)
                        unpacked.append(part_b)
                        bin_weight = max_vehicle_capacity_kg
                else:
                    unpacked.append(p)

            if not current_bin and unpacked:
                first = unpacked.pop(0)
                first_wt = float(first.get("quantity_kg", 500.0))
                if first_wt > max_vehicle_capacity_kg:
                    part_a = dict(first)
                    part_a["quantity_kg"] = max_vehicle_capacity_kg
                    current_bin.append(part_a)

                    part_b = dict(first)
                    part_b["quantity_kg"] = round(first_wt - max_vehicle_capacity_kg, 1)
                    unpacked.insert(0, part_b)
                else:
                    current_bin.append(first)

            route_res = cls.optimize_pooled_route(
                pickups=current_bin,
                destination=destination,
                max_vehicle_capacity_kg=max_vehicle_capacity_kg,
                cost_per_km_freight_inr=cost_per_km_freight_inr
            )
            if hasattr(route_res, "vehicle_id"):
                route_res.vehicle_id = f"VEH-{veh_counter:02d}"
            fleet_routes.append(route_res)
            veh_counter += 1
            remaining_pool = unpacked

        total_dispatched = sum(r.total_weight_kg if hasattr(r, "total_weight_kg") else r["total_weight_kg"] for r in fleet_routes)
        total_fleet_cost = sum(r.total_trip_freight_cost_inr if hasattr(r, "total_trip_freight_cost_inr") else r["total_trip_freight_cost_inr"] for r in fleet_routes)
        total_co2_saved = sum(r.co2_saved_kg if hasattr(r, "co2_saved_kg") else r["co2_saved_kg"] for r in fleet_routes)

        return {
            "fleet_size": len(fleet_routes),
            "total_input_kg": round(total_input_kg, 1),
            "total_dispatched_kg": round(total_dispatched, 1),
            "quantity_conservation_verified": round(total_dispatched, 1) == round(total_input_kg, 1),
            "total_fleet_freight_cost_inr": round(total_fleet_cost, 2),
            "total_fleet_co2_saved_kg": round(total_co2_saved, 2),
            "fleet_vehicles": fleet_routes
        }
