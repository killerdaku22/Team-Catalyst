import math
from typing import List, Dict, Any

class LogisticsOptimizationEngine:
    """
    Smart Multi-Stop Logistics & Pooling Engine for SIH26033.
    Solves Vehicle Routing Problem (VRP) for farm produce pickup & delivery.
    """

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between two points in km using Haversine formula."""
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def optimize_pooled_route(
        cls,
        pickups: List[Dict[str, Any]],
        destination: Dict[str, Any],
        max_vehicle_capacity_kg: float = 5000.0
    ) -> Dict[str, Any]:
        """
        Groups pickups into capacity-bounded clusters and finds near-optimal pickup sequence.
        """
        if not pickups:
            return {
                "route": [],
                "total_distance_km": 0.0,
                "total_weight_kg": 0.0,
                "estimated_time_hours": 0.0,
                "co2_saved_kg": 0.0,
                "spoilage_risk_percent": 0.0
            }

        # Filter pickups that fit within payload
        current_load = 0.0
        selected_pickups = []
        for p in pickups:
            p_weight = float(p.get("quantity_kg", 500.0))
            if current_load + p_weight <= max_vehicle_capacity_kg:
                current_load += p_weight
                selected_pickups.append(p)

        # Nearest-Neighbor Route Solver starting from first pickup to destination
        unvisited = list(selected_pickups)
        optimized_stops = []
        
        # Start at the first farm pickup
        current_loc = unvisited.pop(0)
        optimized_stops.append(current_loc)
        
        total_distance = 0.0
        
        while unvisited:
            curr_lat, curr_lng = float(current_loc["latitude"]), float(current_loc["longitude"])
            # Find nearest unvisited pickup
            nearest_idx = 0
            min_dist = float("inf")
            for idx, item in enumerate(unvisited):
                dist = cls.haversine_distance(curr_lat, curr_lng, float(item["latitude"]), float(item["longitude"]))
                if dist < min_dist:
                    min_dist = dist
                    nearest_idx = idx
            
            nearest_stop = unvisited.pop(nearest_idx)
            total_distance += min_dist
            optimized_stops.append(nearest_stop)
            current_loc = nearest_stop

        # Final leg to destination hub
        dest_lat, dest_lng = float(destination["latitude"]), float(destination["longitude"])
        last_lat, last_lng = float(current_loc["latitude"]), float(current_loc["longitude"])
        final_leg_dist = cls.haversine_distance(last_lat, last_lng, dest_lat, dest_lng)
        total_distance += final_leg_dist
        
        # Add final destination to stop list
        optimized_stops.append({
            "name": destination.get("name", "Urban Consumer Distribution Hub"),
            "latitude": dest_lat,
            "longitude": dest_lng,
            "type": "DESTINATION_HUB"
        })

        # Calculate time & savings metrics
        # Average speed: 45 km/h for rural-urban transit
        est_hours = total_distance / 45.0
        
        # Individual trip comparison (separate trips vs 1 consolidated pooled trip)
        if len(selected_pickups) <= 1:
            # Single farm pickup: no pooling distance saved
            unpooled_distance = total_distance
            distance_saved_km = 0.0
        else:
            # Multiple farm pickups: each farm would have dispatched individual trips to destination
            unpooled_distance = sum(
                cls.haversine_distance(float(p["latitude"]), float(p["longitude"]), dest_lat, dest_lng)
                for p in selected_pickups
            )
            # Route consolidation saves duplicate transit
            distance_saved_km = max(0.0, unpooled_distance - total_distance)
        
        # CO2 emissions model: 0.26 kg CO2 per km saved (standard diesel commercial freight)
        co2_saved_kg = distance_saved_km * 0.26
        
        # Spoilage risk model: 0.5% per hour in transit with cold-chain control
        spoilage_risk_percent = min(15.0, round(1.2 + (est_hours * 0.4), 1))

        return {
            "route_waypoints": optimized_stops,
            "stops_count": len(optimized_stops),
            "total_weight_kg": round(current_load, 1),
            "vehicle_capacity_utilization_percent": round((current_load / max_vehicle_capacity_kg) * 100.0, 1),
            "total_distance_km": round(total_distance, 2),
            "estimated_time_hours": round(est_hours, 2),
            "distance_saved_vs_unpooled_km": round(distance_saved_km, 2),
            "co2_saved_kg": round(co2_saved_kg, 2),
            "spoilage_risk_percent": spoilage_risk_percent
        }
