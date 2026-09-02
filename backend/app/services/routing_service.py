import time
import httpx
from typing import List, Dict, Any
from datetime import datetime, timezone
from app.core.config import settings

class OSRMRoutingService:
    """
    OpenStreetMap OSRM Routing service for real turn-by-turn logistics routes,
    with resilient geometric caching and explicit provenance attribution.
    """

    _CACHE: Dict[str, Dict[str, Any]] = {}
    CACHE_TTL_SECONDS = 3600  # 1-hour route cache (road networks are static)

    @classmethod
    async def get_route_geometry(cls, coordinates: List[List[float]]) -> Dict[str, Any]:
        """
        Coordinates format: [[lng1, lat1], [lng2, lat2], ...]
        """
        if len(coordinates) < 2:
            return {
                "distance_km": 0.0,
                "duration_minutes": 0.0,
                "waypoints": coordinates,
                "provenance_source": "Zero-distance local waypoint",
                "provenance_status": "TRIVIAL"
            }

        coord_str = ";".join([f"{round(lon, 4)},{round(lat, 4)}" for lon, lat in coordinates])
        cache_key = coord_str
        now_ts = time.time()
        fetched_at_iso = datetime.now(timezone.utc).isoformat()
        cached_at_iso = datetime.fromtimestamp(now_ts, timezone.utc).isoformat()

        if cache_key in cls._CACHE:
            cached_entry = cls._CACHE[cache_key]
            if now_ts - cached_entry["timestamp"] < cls.CACHE_TTL_SECONDS:
                return cached_entry["data"]

        url = f"{settings.OSRM_ROUTING_URL}/{coord_str}?overview=full&geometries=geojson"

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        route = routes[0]
                        dist_meters = route.get("distance", 0.0)
                        dur_seconds = route.get("duration", 0.0)
                        geometry = route.get("geometry", {})
                        
                        route_result = {
                            "distance_km": round(dist_meters / 1000.0, 2),
                            "duration_minutes": round(dur_seconds / 60.0, 1),
                            "geometry": geometry,
                            "provenance_source": "OSRM OpenStreetMap Highway Engine",
                            "provenance_status": "REAL_ROAD_NETWORK",
                            "data_classification": "LIVE_OBSERVED",
                            "fetched_at": fetched_at_iso,
                            "cached_at": cached_at_iso,
                            "status": "OSRM_LIVE"
                        }
                        cls._CACHE[cache_key] = {"timestamp": now_ts, "data": route_result}
                        return route_result
        except Exception:
            pass

        # Haversine distance fallback
        dist = 0.0
        from app.engines.logistics_engine import LogisticsOptimizationEngine
        for i in range(len(coordinates) - 1):
            lon1, lat1 = coordinates[i]
            lon2, lat2 = coordinates[i+1]
            dist += LogisticsOptimizationEngine.haversine_distance(lat1, lon1, lat2, lon2)

        fallback_result = {
            "distance_km": round(dist, 2),
            "duration_minutes": round((dist / 45.0) * 60.0, 1),
            "geometry": {"type": "LineString", "coordinates": coordinates},
            "provenance_source": "Great-Circle Haversine Geodesic Model",
            "provenance_status": "ESTIMATED_HAVERSINE",
            "data_classification": "MODEL_OUTPUT",
            "fetched_at": fetched_at_iso,
            "cached_at": cached_at_iso,
            "status": "ESTIMATED_HAVERSINE"
        }
        cls._CACHE[cache_key] = {"timestamp": now_ts, "data": fallback_result}
        return fallback_result
