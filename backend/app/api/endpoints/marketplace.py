from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import CropListing, DirectOrder, ListingStatus, OrderStatus, User, UserRole
from app.engines.price_engine import FairPriceEngine
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import AuditService

router = APIRouter()

class CreateListingSchema(BaseModel):
    fpo_name: str = Field(..., min_length=2, max_length=120)
    crop_name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=50) # Cereals, Vegetables, Pulses, Fruits
    grade: str = Field("Grade A", max_length=50)
    quantity_kg: float = Field(..., gt=0)
    price_per_kg: float = Field(..., gt=0)
    middleman_baseline_price: float = Field(..., gt=0)
    consumer_benchmark_price: float = Field(..., gt=0)
    harvest_date: str
    shelf_life_days: int = Field(7, ge=1, le=365)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: str = Field(..., min_length=2, max_length=150)

class PriceBreakdownRequestSchema(BaseModel):
    farmer_target_price_per_kg: float = Field(..., gt=0)
    quantity_kg: float = Field(..., gt=0)
    distance_km: float = Field(120.0, ge=0)
    middleman_baseline_price_per_kg: float = Field(..., gt=0)
    consumer_benchmark_retail_price_per_kg: float = Field(..., gt=0)

class CreateOrderSchema(BaseModel):
    listing_id: int = Field(..., gt=0)
    quantity_kg: float = Field(..., gt=0)
    agreed_price_per_kg: float = Field(..., gt=0)
    distance_km: float = Field(120.0, ge=0)

class ListingResponseSchema(BaseModel):
    id: int
    seller_id: int
    fpo_name: str
    crop_name: str
    category: str
    grade: str
    quantity_kg: float
    price_per_kg: float
    middleman_baseline_price: float
    consumer_benchmark_price: float
    harvest_date: str
    shelf_life_days: int
    latitude: float
    longitude: float
    location_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponseSchema(BaseModel):
    id: int
    buyer_id: int
    listing_id: int
    quantity_kg: float
    agreed_price_per_kg: float
    farmer_payout: float
    logistics_fee: float
    total_amount: float
    savings_vs_retail: float
    farmer_earnings_uplift: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/listings", response_model=List[ListingResponseSchema])
def get_crop_listings(
    crop: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = ListingStatus.AVAILABLE.value,
    db: Session = Depends(get_db)
):
    """Retrieve public available crop listings."""
    query = db.query(CropListing)
    if status:
        query = query.filter(CropListing.status == status)
    if crop:
        query = query.filter(CropListing.crop_name.ilike(f"%{crop}%"))
    if category:
        query = query.filter(CropListing.category.ilike(f"%{category}%"))
    
    return query.order_by(CropListing.created_at.desc()).all()

@router.post("/listings", response_model=ListingResponseSchema, status_code=status.HTTP_201_CREATED)
def create_crop_listing(
    listing_in: CreateListingSchema,
    current_user: User = Depends(require_roles([UserRole.FPO_MANAGER, UserRole.FPO, UserRole.FARMER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new produce batch listing for direct sale.
    Authorized for Farmers and FPO Managers only.
    """
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

    # Record tamper-evident audit trail
    AuditService.record_event(
        db=db,
        event_type="PRODUCE_LISTING_CREATED",
        action="CREATE",
        resource_type="crop_listing",
        user_id=current_user.id,
        resource_id=str(listing.id),
        details={
            "crop": listing.crop_name,
            "quantity_kg": listing.quantity_kg,
            "price_per_kg": listing.price_per_kg,
            "fpo": listing.fpo_name
        }
    )

    return listing

@router.post("/price-breakdown")
def calculate_price_breakdown(req: PriceBreakdownRequestSchema):
    """Calculate transparent disintermediation margin breakdown and consumer savings."""
    return FairPriceEngine.calculate_price_breakdown(
        farmer_target_price_per_kg=req.farmer_target_price_per_kg,
        quantity_kg=req.quantity_kg,
        distance_km=req.distance_km,
        middleman_baseline_price_per_kg=req.middleman_baseline_price_per_kg,
        consumer_benchmark_retail_price_per_kg=req.consumer_benchmark_retail_price_per_kg
    )

@router.post("/orders", response_model=OrderResponseSchema, status_code=status.HTTP_201_CREATED)
def place_direct_order(
    order_in: CreateOrderSchema,
    current_user: User = Depends(require_roles([UserRole.BUYER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Place a direct purchase order against an available crop listing.
    Authorized for Buyers and Administrators.
    """
    listing = db.query(CropListing).filter(CropListing.id == order_in.listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop listing not found"
        )

    if listing.status == ListingStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing has already been purchased and is no longer available"
        )

    # BOLA / Fraud check: A seller cannot buy their own produce listing
    if listing.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sellers cannot purchase their own produce listings"
        )

    if order_in.quantity_kg > listing.quantity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({order_in.quantity_kg} kg) exceeds available batch ({listing.quantity_kg} kg)"
        )

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

    # Record tamper-evident audit trail for financial transaction
    AuditService.record_event(
        db=db,
        event_type="DIRECT_ORDER_CONFIRMED",
        action="CREATE",
        resource_type="direct_order",
        user_id=current_user.id,
        resource_id=str(new_order.id),
        details={
            "listing_id": listing.id,
            "crop": listing.crop_name,
            "quantity_kg": new_order.quantity_kg,
            "total_amount": new_order.total_amount,
            "farmer_payout": new_order.farmer_payout,
            "savings_vs_retail": new_order.savings_vs_retail
        }
    )

    return new_order
