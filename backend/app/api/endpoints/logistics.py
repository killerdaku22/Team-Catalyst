from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.db.database import get_db
from app.db.models import LogisticsTrip, TripStatus
from app.engines.logistics_engine import LogisticsOptimizationEngine
from app.services.routing_service import OSRMRoutingService

router = APIRouter()

class PickupPointSchema(BaseModel):
    id: int
    fpo_name: str
    crop_name: str
    quantity_kg: float
    latitude: float
    longitude: float

class DestinationHubSchema(BaseModel):
    name: str = "Central Delhi Consumer Hub"
    latitude: float = 28.6139
    longitude: float = 77.2090

class RouteOptimizationRequestSchema(BaseModel):
    pickups: List[PickupPointSchema]
    destination: DestinationHubSchema
    max_capacity_kg: float = 5000.0

@router.post("/optimize-route")
async def optimize_logistics_route(req: RouteOptimizationRequestSchema):
    pickups_dict = [p.dict() for p in req.pickups]
    dest_dict = req.destination.dict()

    vrp_result = LogisticsOptimizationEngine.optimize_pooled_route(
        pickups=pickups_dict,
        destination=dest_dict,
        max_vehicle_capacity_kg=req.max_capacity_kg
    )

    # Fetch geometry from OSRM
    coords = [[float(stop["longitude"]), float(stop["latitude"])] for stop in vrp_result["route_waypoints"]]
    osrm_res = await OSRMRoutingService.get_route_geometry(coords)
    vrp_result["osrm_geometry"] = osrm_res.get("geometry")
    
    return vrp_result

@router.get("/trips")
def get_logistics_trips(db: Session = Depends(get_db)):
    return db.query(LogisticsTrip).order_by(LogisticsTrip.created_at.desc()).all()
