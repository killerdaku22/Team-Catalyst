from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import get_db
from app.db.models import LogisticsTrip, TripStatus
from app.engines.logistics_engine import (
    LogisticsOptimizationEngine,
    RouteOptimizationRequest,
    OptimizedRouteResult,
    PickupStopSchema,
    DestinationHubSchema
)
from app.services.routing_service import OSRMRoutingService
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/optimize-route")
async def optimize_logistics_route(
    req: RouteOptimizationRequest,
    db: Session = Depends(get_db)
):
    """
    Computes multi-stop pooled VRP route with 2-opt heuristic, carbon emissions savings, and pro-rata FPO cost allocations.
    """
    vrp_result = LogisticsOptimizationEngine.optimize_pooled_route(req)
    result_dict = vrp_result.dict()

    # Attempt to fetch road geometry from OSRM
    coords = [[float(stop["longitude"]), float(stop["latitude"])] for stop in vrp_result.route_waypoints]
    osrm_res = await OSRMRoutingService.get_route_geometry(coords)
    result_dict["osrm_geometry"] = osrm_res.get("geometry")

    # Record logistics optimization audit log
    AuditService.record_event(
        db=db,
        event_type="LOGISTICS_ROUTE_OPTIMIZED",
        action="OPTIMIZE_VRP",
        resource_type="logistics_engine",
        details={
            "stops_count": vrp_result.stops_count,
            "total_weight_kg": vrp_result.total_weight_kg,
            "capacity_utilization": vrp_result.vehicle_capacity_utilization_percent,
            "distance_saved_km": vrp_result.distance_saved_vs_unpooled_km,
            "co2_saved_kg": vrp_result.co2_saved_kg
        }
    )

    return result_dict

@router.get("/trips")
def get_logistics_trips(db: Session = Depends(get_db)):
    """Retrieve history of active and dispatched consolidated logistics trips."""
    return db.query(LogisticsTrip).order_by(LogisticsTrip.created_at.desc()).all()
