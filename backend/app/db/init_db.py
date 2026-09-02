from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import User, UserRole, CropListing, ListingStatus, FPOCluster
from app.core.security import hash_password

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        # Check if users already exist
        if db.query(User).count() == 0:
            print("Seeding initial users and FPO listings...")
            
            # Users
            fpo_user = User(
                email="fpo.ludhiana@agridirect.in",
                hashed_password=hash_password("password123"),
                full_name="Ludhiana Farmers Cooperative FPO",
                role=UserRole.FPO,
                phone="+91-9876543210",
                location_name="Ludhiana, Punjab",
                latitude=30.9010,
                longitude=75.8573
            )
            buyer_user = User(
                email="procurement@freshretail.in",
                hashed_password=hash_password("password123"),
                full_name="FreshRetail India Supermarkets",
                role=UserRole.BUYER,
                phone="+91-9812345678",
                location_name="Connaught Place, New Delhi",
                latitude=28.6315,
                longitude=77.2167
            )
            logistics_user = User(
                email="dispatch@agrilogistics.in",
                hashed_password=hash_password("password123"),
                full_name="Kisan Express Cold Chain Logistics",
                role=UserRole.LOGISTICS,
                phone="+91-9988776655",
                location_name="Ambala Freight Hub, Haryana",
                latitude=30.3782,
                longitude=76.7767
            )
            admin_user = User(
                email="observer@doca.gov.in",
                hashed_password=hash_password("password123"),
                full_name="DoCA Market Intelligence Observer",
                role=UserRole.DOCA_OBSERVER,
                phone="+91-1123380000",
                location_name="Krishi Bhawan, New Delhi",
                latitude=28.6184,
                longitude=77.2140
            )
            
            db.add_all([fpo_user, buyer_user, logistics_user, admin_user])
            db.commit()
            db.refresh(fpo_user)

            # FPO Clusters
            fpo_clusters = [
                FPOCluster(name="Ludhiana Agri Cooperative", region="Ludhiana", state="Punjab", contact_person="Gurdeep Singh", phone="+91-9876543210", latitude=30.9010, longitude=75.8573, verified_members=120),
                FPOCluster(name="Nashik Farmer Producer Co", region="Nashik", state="Maharashtra", contact_person="Ramesh Patil", phone="+91-9822001122", latitude=19.9975, longitude=73.7898, verified_members=250),
                FPOCluster(name="Kolar Tomato Growers Union", region="Kolar", state="Karnataka", contact_person="Venkatesh Gowda", phone="+91-9448003344", latitude=13.1367, longitude=78.1292, verified_members=180),
                FPOCluster(name="Agra Potato Producers FPO", region="Agra", state="Uttar Pradesh", contact_person="Suresh Sharma", phone="+91-9719005566", latitude=27.1767, longitude=78.0081, verified_members=210)
            ]
            db.add_all(fpo_clusters)
            db.commit()

            # Crop Listings
            listings = [
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Ludhiana Agri Cooperative",
                    crop_name="Wheat (Kalyan Sona)",
                    category="Cereals",
                    grade="Grade A Premium",
                    quantity_kg=4500.0,
                    price_per_kg=24.50, # Farmer target price
                    middleman_baseline_price=21.00, # Local broker payout
                    consumer_benchmark_price=34.00, # Urban retail price
                    harvest_date="2026-08-20",
                    shelf_life_days=180,
                    latitude=30.9010,
                    longitude=75.8573,
                    location_name="Ludhiana Farm Cluster, Punjab",
                    status=ListingStatus.AVAILABLE
                ),
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Nashik Farmer Producer Co",
                    crop_name="Red Onion (Nashik Quality)",
                    category="Vegetables",
                    grade="Grade A",
                    quantity_kg=3200.0,
                    price_per_kg=23.00,
                    middleman_baseline_price=17.50,
                    consumer_benchmark_price=38.00,
                    harvest_date="2026-08-21",
                    shelf_life_days=30,
                    latitude=19.9975,
                    longitude=73.7898,
                    location_name="Lasalgaon Farm Hub, Nashik",
                    status=ListingStatus.AVAILABLE
                ),
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Kolar Tomato Growers Union",
                    crop_name="Hybrid Red Tomato",
                    category="Vegetables",
                    grade="Grade A Fresh",
                    quantity_kg=2800.0,
                    price_per_kg=32.00,
                    middleman_baseline_price=24.00,
                    consumer_benchmark_price=52.00,
                    harvest_date="2026-08-22",
                    shelf_life_days=10,
                    latitude=13.1367,
                    longitude=78.1292,
                    location_name="Kolar Agri Cluster, Karnataka",
                    status=ListingStatus.AVAILABLE
                ),
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Agra Potato Producers FPO",
                    crop_name="White Potato (Jyoti Variety)",
                    category="Vegetables",
                    grade="Grade A",
                    quantity_kg=5000.0,
                    price_per_kg=16.80,
                    middleman_baseline_price=13.20,
                    consumer_benchmark_price=26.00,
                    harvest_date="2026-08-19",
                    shelf_life_days=60,
                    latitude=27.1767,
                    longitude=78.0081,
                    location_name="Agra Farm Hub, Uttar Pradesh",
                    status=ListingStatus.AVAILABLE
                ),
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Karnal Basmati Growers Federation",
                    crop_name="Basmati Rice (Pusa 1121)",
                    category="Cereals",
                    grade="Grade A Export",
                    quantity_kg=3500.0,
                    price_per_kg=34.50,
                    middleman_baseline_price=27.00,
                    consumer_benchmark_price=54.00,
                    harvest_date="2026-08-18",
                    shelf_life_days=180,
                    latitude=29.6857,
                    longitude=76.9905,
                    location_name="Taraori Mandi Cluster, Karnal, Haryana",
                    status=ListingStatus.AVAILABLE
                ),
                CropListing(
                    seller_id=fpo_user.id,
                    fpo_name="Hosur Polyhouse Cultivators FPO",
                    crop_name="Green Capsicum (Bell Pepper)",
                    category="Vegetables",
                    grade="Grade A Fresh",
                    quantity_kg=2200.0,
                    price_per_kg=38.00,
                    middleman_baseline_price=28.00,
                    consumer_benchmark_price=58.00,
                    harvest_date="2026-08-23",
                    shelf_life_days=14,
                    latitude=12.7409,
                    longitude=77.8253,
                    location_name="Hosur Agri Hub, Tamil Nadu",
                    status=ListingStatus.AVAILABLE
                )
            ]
            db.add_all(listings)
            db.commit()
            print("Database initialized & seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
