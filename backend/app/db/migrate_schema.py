import sys
import os
sys.path.insert(0, os.path.abspath("."))
from sqlalchemy import text
from app.db.database import engine, Base
from app.db.models import MandiPriceRecord

def run_migrations():
    print("Ensuring database tables and columns exist in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # mandi_price_records schema updates
        statements = [
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS price_per_kg FLOAT DEFAULT 25.0;",
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS arrival_tonnes FLOAT DEFAULT 10.0;",
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS source VARCHAR(64) DEFAULT 'HISTORICAL_CSV';",
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS quality_flags_json TEXT DEFAULT '[]';",
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT TRUE;",
            "ALTER TABLE mandi_price_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            # direct_orders schema updates
            "ALTER TABLE direct_orders ADD COLUMN IF NOT EXISTS farmer_earnings_uplift FLOAT DEFAULT 0.0;",
            "ALTER TABLE direct_orders ADD COLUMN IF NOT EXISTS savings_vs_retail FLOAT DEFAULT 0.0;",
            # logistics_trips schema updates
            "ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS co2_saved_kg FLOAT DEFAULT 0.0;",
            "ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS spoilage_risk_percent FLOAT DEFAULT 2.5;"
        ]
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"Statement warning ({stmt[:40]}...): {e}")
                conn.rollback()

    print("Schema alignment complete!")

if __name__ == "__main__":
    run_migrations()
