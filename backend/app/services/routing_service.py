import httpx
from typing import List, Dict, Any
from app.core.config import settings

class OSRMRoutingService:
    """OpenStreetMap OSRM Routing service for real turn-by-turn logistics routes."""

    @classmethod
    async def get_route_geometry(cls, coordinates: List[List[float]]) -> Dict[str, Any]:
        """
        Coordinates format: [[lng1, lat1], [lng2, lat2], ...]
        """
        if len(coordinates) < 2:
            return {"distance_km": 0.0, "duration_minutes": 0.0, "waypoints": coordinates}

        coord_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        url = f"{settings.OSRM_ROUTING_URL}/{coord_str}?overview=full&geometries=geojson"

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        route = routes[0]
                        dist_meters = route.get("distance", 0.0)
                        dur_seconds = route.get("duration", 0.0)
                        geometry = route.get("geometry", {})
                        
                        return {
                            "distance_km": round(dist_meters / 1000.0, 2),
                            "duration_minutes": round(dur_seconds / 60.0, 1),
                            "geometry": geometry,
                            "status": "OSRM_LIVE"
                        }
        except Exception:
            pass

        # Haversine distance fallback
        dist = 0.0
        from app.engines.logistics_engine import LogisticsOptimizationEngine
        for i in range(len(coordinates) - 1):
            lon1, lat1 = coordinates[i]
            lon2, lat2 = coordinates[i+1]
            dist += LogisticsOptimizationEngine.haversine_distance(lat1, lon1, lat2, lon2)

        return {
            "distance_km": round(dist, 2),
            "duration_minutes": round((dist / 45.0) * 60.0, 1),
            "geometry": {"type": "LineString", "coordinates": coordinates},
            "status": "ESTIMATED_HAVERSINE"
        }
