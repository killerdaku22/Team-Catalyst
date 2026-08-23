from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import CropListing, DirectOrder, ListingStatus, OrderStatus, User
from app.engines.price_engine import FairPriceEngine
from app.api.endpoints.auth import get_current_user

router = APIRouter()

class CreateListingSchema(BaseModel):
    fpo_name: str
    crop_name: str
    category: str # Cereals, Vegetables, Pulses, Fruits
    grade: str = "Grade A"
    quantity_kg: float
    price_per_kg: float
    middleman_baseline_price: float
    consumer_benchmark_price: float
    harvest_date: str
    shelf_life_days: int = 7
    latitude: float
    longitude: float
    location_name: str

class PriceBreakdownRequestSchema(BaseModel):
    farmer_target_price_per_kg: float
    quantity_kg: float
    distance_km: float = 120.0
    middleman_baseline_price_per_kg: float
    consumer_benchmark_retail_price_per_kg: float

class CreateOrderSchema(BaseModel):
    listing_id: int
    quantity_kg: float
    agreed_price_per_kg: float
    distance_km: float = 120.0

@router.get("/listings")
def get_crop_listings(
    crop: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = ListingStatus.AVAILABLE.value,
    db: Session = Depends(get_db)
):
    query = db.query(CropListing)
    if status:
        query = query.filter(CropListing.status == status)
    if crop:
        query = query.filter(CropListing.crop_name.ilike(f"%{crop}%"))
    if category:
        query = query.filter(CropListing.category.ilike(f"%{category}%"))
    
    return query.order_by(CropListing.created_at.desc()).all()

@router.post("/listings")
def create_crop_listing(
    listing_in: CreateListingSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = CropListing(
        seller_id=current_user.id,
        fpo_name=listing_in.fpo_name,
        crop_name=listing_in.crop_name,
        category=listing_in.category,
        grade=listing_in.grade,
        quantity_kg=listing_in.quantity_kg,
        price_per_kg=listing_in.price_per_kg,
        middleman_baseline_price=listing_in.middleman_baseline_price,
        consumer_benchmark_price=listing_in.consumer_benchmark_price,
        harvest_date=listing_in.harvest_date,
        shelf_life_days=listing_in.shelf_life_days,
        latitude=listing_in.latitude,
        longitude=listing_in.longitude,
        location_name=listing_in.location_name,
        status=ListingStatus.AVAILABLE
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.post("/price-breakdown")
def calculate_price_breakdown(req: PriceBreakdownRequestSchema):
    return FairPriceEngine.calculate_price_breakdown(
        farmer_target_price_per_kg=req.farmer_target_price_per_kg,
        quantity_kg=req.quantity_kg,
        distance_km=req.distance_km,
        middleman_baseline_price_per_kg=req.middleman_baseline_price_per_kg,
        consumer_benchmark_retail_price_per_kg=req.consumer_benchmark_retail_price_per_kg
    )

@router.post("/orders")
def place_direct_order(
    order_in: CreateOrderSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(CropListing).filter(CropListing.id == order_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Crop listing not found")

    if listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=400, detail="Listing is already sold")

    breakdown = FairPriceEngine.calculate_price_breakdown(
        farmer_target_price_per_kg=order_in.agreed_price_per_kg,
        quantity_kg=order_in.quantity_kg,
        distance_km=order_in.distance_km,
        middleman_baseline_price_per_kg=listing.middleman_baseline_price,
        consumer_benchmark_retail_price_per_kg=listing.consumer_benchmark_price
    )

    new_order = DirectOrder(
        buyer_id=current_user.id,
        listing_id=listing.id,
        quantity_kg=order_in.quantity_kg,
        agreed_price_per_kg=order_in.agreed_price_per_kg,
        farmer_payout=breakdown["total_farmer_payout_direct"],
        logistics_fee=breakdown["logistics_cost_per_kg"] * order_in.quantity_kg,
        total_amount=breakdown["total_consumer_cost_direct"],
        savings_vs_retail=breakdown["consumer_savings_amount"],
        farmer_earnings_uplift=breakdown["farmer_earnings_uplift_amount"],
        status=OrderStatus.CONFIRMED
    )

    listing.status = ListingStatus.SOLD
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order
