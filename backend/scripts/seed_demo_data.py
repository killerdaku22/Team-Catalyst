import sys
import os
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import Base, engine, SessionLocal
from app.db.models import User, UserRole, CropListing, ListingStatus, AuditEvent
from app.core.security import hash_password
from app.services.audit_service import AuditService

def seed_database():
    print("=================================================================")
    print("[*] AGRIDIRECT: SEEDING DEMO DATABASE FOR SIH HACKATHON EVALUATION")
    print("=================================================================")

    # Initialize tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clean existing demo seed data
        db.query(AuditEvent).delete()
        db.query(CropListing).delete()
        db.query(User).delete()
        db.commit()

        print("[1/3] Creating Demo User Accounts for All Roles...")
        demo_users = [
            User(
                email="farmer@agridirect.org",
                hashed_password=hash_password("FarmerPass@123"),
                full_name="Ramesh Kumar (Kolar Tomato Producer)",
                role=UserRole.FARMER,
                is_active=True
            ),
            User(
                email="fpo_manager@agridirect.org",
                hashed_password=hash_password("FpoPass@123"),
                full_name="Malwa Kisan Samiti FPO President",
                role=UserRole.FPO_MANAGER,
                is_active=True
            ),
            User(
                email="buyer@bigbasket.com",
                hashed_password=hash_password("BuyerPass@123"),
                full_name="Vikram Seth (BigBasket Direct Sourcing Manager)",
                role=UserRole.BUYER,
                is_active=True
            ),
            User(
                email="auditor@doca.gov.in",
                hashed_password=hash_password("AuditorPass@123"),
                full_name="Dr. Sunita Sharma (DoCA Price Stabilization Director)",
                role=UserRole.GOVT_AUDITOR,
                is_active=True
            ),
            User(
                email="admin@agridirect.org",
                hashed_password=hash_password("AdminPass@123"),
                full_name="AgriDirect System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
        ]
        db.add_all(demo_users)
        db.commit()
        print(f"[+] Created {len(demo_users)} verified user accounts across 5 RBAC tiers.")

        # Re-query users to obtain DB-generated IDs
        admin_user = db.query(User).filter(User.email == "admin@agridirect.org").first()
        fpo_user = db.query(User).filter(User.email == "fpo_manager@agridirect.org").first()

        # 2. Seed Produce Direct Listings
        print("[2/3] Seeding Direct FPO Produce Marketplace Listings...")
        listings = [
            CropListing(
                seller_id=fpo_user.id,
                fpo_name="Kolar Farmers Federation",
                crop_name="Tomato",
                category="Vegetables",
                grade="Grade A Fresh",
                quantity_kg=4000.0,
                price_per_kg=28.0,
                middleman_baseline_price=21.0,
                consumer_benchmark_price=42.0,
                location_name="Kolar Agri Hub, Karnataka",
                latitude=13.1367,
                longitude=78.1292,
                harvest_date="2026-08-27",
                shelf_life_days=10,
                status=ListingStatus.AVAILABLE
            ),
            CropListing(
                seller_id=fpo_user.id,
                fpo_name="Nashik Agro Producer Co.",
                crop_name="Onion",
                category="Vegetables",
                grade="Grade A Export",
                quantity_kg=8000.0,
                price_per_kg=24.5,
                middleman_baseline_price=17.5,
                consumer_benchmark_price=38.0,
                location_name="Pimpalgaon, Nashik",
                latitude=20.1700,
                longitude=73.9800,
                harvest_date="2026-08-26",
                shelf_life_days=25,
                status=ListingStatus.AVAILABLE
            ),
            CropListing(
                seller_id=fpo_user.id,
                fpo_name="Agra Potato Producers Union",
                crop_name="Potato",
                category="Vegetables",
                grade="Processing Grade",
                quantity_kg=12000.0,
                price_per_kg=16.0,
                middleman_baseline_price=11.5,
                consumer_benchmark_price=26.0,
                location_name="Khandari, Agra",
                latitude=27.1767,
                longitude=78.0081,
                harvest_date="2026-08-25",
                shelf_life_days=30,
                status=ListingStatus.AVAILABLE
            )
        ]
        db.add_all(listings)
        db.commit()
        print(f"[+] Created {len(listings)} direct farmgate produce batches.")

        # 3. Generate Cryptographic Audit Trail Genesis & Initial Blocks
        print("[3/3] Generating Cryptographic SHA-256 Tamper-Evident Audit Chain...")
        AuditService.record_event(
            db=db,
            event_type="GENESIS_SYSTEM_INIT",
            action="BOOTSTRAP",
            resource_type="system",
            user_id=admin_user.id,
            resource_id="SYS-INIT-26033",
            details={"version": "2.0.0", "sih_problem": "26033", "authority": "DoCA"}
        )
        AuditService.record_event(
            db=db,
            event_type="PRODUCE_BATCH_LISTED",
            action="PUBLISH",
            resource_type="marketplace",
            user_id=fpo_user.id,
            resource_id=f"LISTING-{listings[0].id}",
            details={"fpo": "Kolar Farmers Federation", "crop": "Tomato", "quantity_kg": 4000.0}
        )
        
        audit_res = AuditService.verify_chain_integrity(db)
        print(f"[+] Tamper-evident audit chain initialized. Status: {audit_res['status']}, Head: {audit_res['chain_head'][:16]}...")

        print("=================================================================")
        print("[SUCCESS] DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=================================================================")
        print("Demo Credentials:")
        print("  - Farmer:       farmer@agridirect.org       / FarmerPass@123")
        print("  - FPO Manager:  fpo_manager@agridirect.org  / FpoPass@123")
        print("  - Buyer:        buyer@bigbasket.com         / BuyerPass@123")
        print("  - Govt Auditor: auditor@doca.gov.in         / AuditorPass@123")
        print("  - Admin:        admin@agridirect.org        / AdminPass@123")
        print("=================================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
