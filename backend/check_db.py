import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.db.models import User, CropListing, FPOCluster

db = SessionLocal()
try:
    users = db.query(User).all()
    listings = db.query(CropListing).all()
    fpos = db.query(FPOCluster).all()
    
    print(f"=== SUPABASE DATABASE STATUS ===")
    print(f"Users:         {len(users)}")
    print(f"FPO Clusters:  {len(fpos)}")
    print(f"Crop Listings: {len(listings)}")
    print()
    
    if users:
        print("--- Users ---")
        for u in users:
            print(f"  [{u.role}] {u.full_name} ({u.email})")
    
    if fpos:
        print("\n--- FPO Clusters ---")
        for f in fpos:
            print(f"  {f.name} | {f.state} | {f.verified_members} members")
    
    if listings:
        print("\n--- Crop Listings ---")
        for l in listings:
            print(f"  {l.crop_name} | {l.fpo_name} | {l.quantity_kg}kg @ Rs.{l.price_per_kg}/kg | Status: {l.status}")
    
    if not users and not listings:
        print("Database is EMPTY — running seed...")
        from app.db.init_db import seed_db
        seed_db()
        print("Seeding complete! Re-run to verify.")
finally:
    db.close()
