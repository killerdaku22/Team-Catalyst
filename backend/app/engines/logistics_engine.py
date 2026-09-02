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

    def __getitem__(self, item):
        return getattr(self, item)

class LogisticsOptimizationEngine:
    """
    Smart Multi-Stop Logistics & Pooling Engine for SIH26033.
    Solves Capacitated Vehicle Routing Problem (CVRP) with Nearest-Neighbor + 2-Opt heuristic.
    """

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

        # Capacity Bounding: Filter pickups that fit within maximum truck payload
        current_load = 0.0
        selected_pickups: List[Dict[str, Any]] = []
        for p in pickups_in:
            p_dict = p.dict() if hasattr(p, 'dict') else dict(p)
            p_weight = float(p_dict.get("quantity_kg", 500.0))
            if current_load + p_weight <= max_cap:
                current_load += p_weight
                selected_pickups.append(p_dict)

        if not selected_pickups:
            first_p = pickups_in[0]
            selected_pickups.append(first_p.dict() if hasattr(first_p, 'dict') else dict(first_p))
            current_load = selected_pickups[0].get("quantity_kg", 500.0)

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
            fpo_cost_allocations=allocations
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
