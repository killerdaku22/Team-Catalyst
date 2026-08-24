import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserRole(str, enum.Enum):
    FPO = "FPO"
    BUYER = "BUYER"
    LOGISTICS = "LOGISTICS"
    MINISTRY_ADMIN = "MINISTRY_ADMIN"

class ListingStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    POOLED = "POOLED"
    SOLD = "SOLD"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class TripStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.FPO, nullable=False)
    phone = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("CropListing", back_populates="seller")
    orders = relationship("DirectOrder", back_populates="buyer")

class FPOCluster(Base):
    __tablename__ = "fpo_clusters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    state = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    verified_members = Column(Integer, default=50)

class CropListing(Base):
    __tablename__ = "crop_listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fpo_name = Column(String, nullable=False)
    crop_name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False) # Cereals, Vegetables, Pulses, Fruits
    grade = Column(String, default="Grade A")
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False) # Farmer target price
    middleman_baseline_price = Column(Float, nullable=False) # Standard local mandi / broker benchmark price
    consumer_benchmark_price = Column(Float, nullable=False) # Urban retail price
    harvest_date = Column(String, nullable=False)
    shelf_life_days = Column(Integer, default=7)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String, nullable=False)
    status = Column(Enum(ListingStatus, native_enum=False), default=ListingStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.utcnow)

    seller = relationship("User", back_populates="listings")
    orders = relationship("DirectOrder", back_populates="listing")

class DirectOrder(Base):
    __tablename__ = "direct_orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("crop_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    agreed_price_per_kg = Column(Float, nullable=False)
    farmer_payout = Column(Float, nullable=False)
    logistics_fee = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    savings_vs_retail = Column(Float, nullable=False)
    farmer_earnings_uplift = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus, native_enum=False), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="orders")
    listing = relationship("CropListing", back_populates="orders")

class LogisticsTrip(Base):
    __tablename__ = "logistics_trips"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False) # E.g., "5-Ton Refrigerated Truck"
    max_capacity_kg = Column(Float, nullable=False)
    current_load_kg = Column(Float, default=0.0)
    origin_name = Column(String, nullable=False)
    destination_name = Column(String, nullable=False)
    waypoints_json = Column(Text, nullable=False) # Waypoint Lat/Lngs and pickup details
    total_distance_km = Column(Float, nullable=False)
    estimated_duration_hrs = Column(Float, nullable=False)
    co2_saved_kg = Column(Float, default=0.0)
    spoilage_risk_percent = Column(Float, default=2.5)
    status = Column(Enum(TripStatus, native_enum=False), default=TripStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)

class MandiPriceRecord(Base):
    __tablename__ = "mandi_price_records"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, index=True, nullable=False)
    district = Column(String, index=True, nullable=False)
    mandi_name = Column(String, index=True, nullable=False)
    commodity = Column(String, index=True, nullable=False)
    variety = Column(String, nullable=True)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrival_tonnes = Column(Float, nullable=False)
    record_date = Column(String, index=True, nullable=False)

class DemandForecastRecord(Base):
    __tablename__ = "demand_forecast_records"

    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String, index=True, nullable=False)
    region = Column(String, index=True, nullable=False)
    forecast_date = Column(String, nullable=False)
    predicted_demand_tonnes = Column(Float, nullable=False)
    predicted_modal_price = Column(Float, nullable=False)
    confidence_interval_low = Column(Float, nullable=False)
    confidence_interval_high = Column(Float, nullable=False)
    key_drivers_json = Column(Text, nullable=False)
