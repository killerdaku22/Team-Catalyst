import csv
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import MandiPriceRecord
from app.services.data_quality_service import DataQualityService
from app.services.audit_service import AuditService

class MandiIngestionService:
    """
    Agricultural Telemetry & Mandi Market Data Ingestion Pipeline.
    """

    @classmethod
    def ingest_records_batch(
        cls,
        db: Session,
        raw_records: List[Dict[str, Any]],
        source_label: str = "LIVE_AGMARKNET",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process a batch of raw records with validation, normalization, and deduplication.
        """
        total_processed = len(raw_records)
        valid_records_to_insert: List[MandiPriceRecord] = []
        rejected_count = 0
        duplicates_skipped = 0
        rejection_reasons = Counter()
        seen_keys = set()

        # Load existing deduplication keys from database for date range if any
        # To avoid query explosion, check candidates in memory
        for raw in raw_records:
            raw["source"] = raw.get("source", source_label)
            is_valid, cleaned, flags = DataQualityService.validate_and_clean_record(raw)
            
            if not is_valid or not cleaned:
                rejected_count += 1
                for f in flags:
                    rejection_reasons[f] += 1
                continue

            dedup_key = DataQualityService.get_deduplication_key(cleaned)
            if dedup_key in seen_keys:
                duplicates_skipped += 1
                continue
            seen_keys.add(dedup_key)

            # Check if identical record already exists in database
            existing = db.query(MandiPriceRecord).filter(
                MandiPriceRecord.state == cleaned["state"],
                MandiPriceRecord.mandi_name == cleaned["mandi_name"],
                MandiPriceRecord.commodity == cleaned["commodity"],
                MandiPriceRecord.record_date == cleaned["record_date"]
            ).first()

            if existing:
                duplicates_skipped += 1
                continue

            record_entity = MandiPriceRecord(
                state=cleaned["state"],
                district=cleaned["district"],
                mandi_name=cleaned["mandi_name"],
                commodity=cleaned["commodity"],
                variety=cleaned["variety"],
                min_price=cleaned["min_price"],
                max_price=cleaned["max_price"],
                modal_price=cleaned["modal_price"],
                price_per_kg=cleaned["price_per_kg"],
                arrival_tonnes=cleaned["arrival_tonnes"],
                record_date=cleaned["record_date"],
                source=cleaned["source"],
                quality_flags_json=json.dumps(cleaned["quality_flags"]),
                is_validated=True,
                created_at=datetime.utcnow()
            )
            valid_records_to_insert.append(record_entity)

        if valid_records_to_insert:
            db.bulk_save_objects(valid_records_to_insert)
            db.commit()

        # Record audit event for ingestion batch
        AuditService.record_event(
            db=db,
            event_type="DATA_INGESTION_BATCH",
            action="INGEST",
            resource_type="mandi_price_records",
            user_id=user_id,
            details={
                "source": source_label,
                "total_processed": total_processed,
                "valid_saved": len(valid_records_to_insert),
                "rejected": rejected_count,
                "duplicates_skipped": duplicates_skipped
            }
        )

        return {
            "total_processed": total_processed,
            "valid_records_saved": len(valid_records_to_insert),
            "rejected_records": rejected_count,
            "duplicates_skipped": duplicates_skipped,
            "data_sources": [source_label],
            "rejection_reasons": dict(rejection_reasons),
            "timestamp": datetime.utcnow().isoformat()
        }

    @classmethod
    def ingest_from_csv(
        cls,
        db: Session,
        csv_path: str,
        max_rows: int = 500,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Ingest records from a local Agmarknet CSV file."""
        p = Path(csv_path)
        if not p.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        raw_records = []
        with open(p, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= max_rows:
                    break
                # Map potential Agmarknet column variations
                raw_records.append({
                    "state": row.get("State") or row.get("state") or "",
                    "district": row.get("District") or row.get("district") or "",
                    "mandi_name": row.get("Market") or row.get("market") or row.get("mandi_name") or "",
                    "commodity": row.get("Commodity") or row.get("commodity") or "",
                    "variety": row.get("Variety") or row.get("variety") or "FAQ",
                    "min_price": row.get("Min_x0020_Price") or row.get("min_price") or 0,
                    "max_price": row.get("Max_x0020_Price") or row.get("max_price") or 0,
                    "modal_price": row.get("Modal_x0020_Price") or row.get("modal_price") or 0,
                    "arrival_tonnes": row.get("Arrival_Tonnes") or row.get("arrival_tonnes") or 25.0,
                    "record_date": row.get("Arrival_Date") or row.get("record_date") or "",
                    "source": "HISTORICAL_CSV"
                })

        return cls.ingest_records_batch(
            db=db,
            raw_records=raw_records,
            source_label="HISTORICAL_CSV",
            user_id=user_id
        )

    @classmethod
    def get_data_quality_summary(cls, db: Session) -> Dict[str, Any]:
        """Generate high-level data health metrics across ingested market telemetry."""
        total_records = db.query(MandiPriceRecord).count()
        if total_records == 0:
            return {
                "total_records": 0,
                "validated_records_count": 0,
                "data_health_score": 100.0,
                "unique_commodities_count": 0,
                "unique_mandis_count": 0,
                "sources_breakdown": {},
                "active_anomaly_count": 0
            }

        validated_count = db.query(MandiPriceRecord).filter(MandiPriceRecord.is_validated == True).count()
        unique_commodities = db.query(MandiPriceRecord.commodity).distinct().count()
        unique_mandis = db.query(MandiPriceRecord.mandi_name).distinct().count()

        # Count anomalies (quality flags not empty)
        anomaly_count = db.query(MandiPriceRecord).filter(MandiPriceRecord.quality_flags_json != "[]").count()

        # Source breakdown
        sources_rows = db.query(MandiPriceRecord.source, func.count(MandiPriceRecord.id)).group_by(MandiPriceRecord.source).all()
        sources_breakdown = {s: c for s, c in sources_rows}

        health_score = round(((validated_count - (anomaly_count * 0.5)) / total_records) * 100.0, 1)
        health_score = max(0.0, min(100.0, health_score))

        return {
            "total_records": total_records,
            "validated_records_count": validated_count,
            "data_health_score": health_score,
            "unique_commodities_count": unique_commodities,
            "unique_mandis_count": unique_mandis,
            "sources_breakdown": sources_breakdown,
            "active_anomaly_count": anomaly_count
        }
