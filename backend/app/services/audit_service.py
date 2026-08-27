import json
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.db.models import AuditEvent

GENESIS_HASH = "0" * 64

class AuditService:
    """
    Tamper-evident hash-chained audit logging service.
    Each event links cryptographically to the previous event:
    current_hash = SHA256(previous_hash + ':' + payload_hash + ':' + event_type + ':' + action + ':' + timestamp)
    """

    @staticmethod
    def _compute_payload_hash(details: Dict[str, Any]) -> Tuple[str, str]:
        """Produce deterministic canonical JSON and its SHA-256 hash."""
        canonical_json = json.dumps(details or {}, sort_keys=True, separators=(',', ':'), default=str)
        payload_hash = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
        return canonical_json, payload_hash

    @staticmethod
    def _compute_event_hash(
        previous_hash: str,
        payload_hash: str,
        event_type: str,
        action: str,
        timestamp_str: str
    ) -> str:
        """Compute current event hash in chain."""
        raw = f"{previous_hash}:{payload_hash}:{event_type}:{action}:{timestamp_str}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()

    @classmethod
    def record_event(
        cls,
        db: Session,
        event_type: str,
        action: str,
        resource_type: str,
        user_id: Optional[int] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        """Record a new tamper-evident audit event at the head of the chain."""
        # Find latest event in chain
        latest = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = latest.current_hash if latest else GENESIS_HASH

        now = datetime.utcnow()
        timestamp_str = now.isoformat()
        
        details_json, payload_hash = cls._compute_payload_hash(details or {})
        current_hash = cls._compute_event_hash(
            previous_hash=prev_hash,
            payload_hash=payload_hash,
            event_type=event_type,
            action=action,
            timestamp_str=timestamp_str
        )

        event = AuditEvent(
            user_id=user_id,
            event_type=event_type,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details_json=details_json,
            payload_hash=payload_hash,
            previous_hash=prev_hash,
            current_hash=current_hash,
            created_at=now
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @classmethod
    def verify_chain_integrity(cls, db: Session) -> Dict[str, Any]:
        """
        Verify mathematical integrity of the entire audit chain.
        Returns validation status, total events checked, and tampering details if any.
        """
        events: List[AuditEvent] = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
        if not events:
            return {
                "is_valid": True,
                "total_events": 0,
                "genesis_hash": GENESIS_HASH,
                "chain_head": None,
                "status": "EMPTY_CHAIN"
            }

        expected_prev_hash = GENESIS_HASH
        for event in events:
            # 1. Check previous_hash continuity
            if event.previous_hash != expected_prev_hash:
                return {
                    "is_valid": False,
                    "tampered_event_id": event.id,
                    "reason": f"Broken chain link at Event #{event.id}. Expected prev_hash {expected_prev_hash[:12]}..., found {event.previous_hash[:12]}...",
                    "total_events_checked": len(events)
                }

            # 2. Recompute payload hash
            try:
                details = json.loads(event.details_json)
            except Exception:
                details = {}
            _, recomputed_payload_hash = cls._compute_payload_hash(details)
            if recomputed_payload_hash != event.payload_hash:
                return {
                    "is_valid": False,
                    "tampered_event_id": event.id,
                    "reason": f"Payload altered at Event #{event.id}. Payload hash mismatch.",
                    "total_events_checked": len(events)
                }

            # 3. Recompute current event hash
            timestamp_str = event.created_at.isoformat()
            recomputed_current_hash = cls._compute_event_hash(
                previous_hash=event.previous_hash,
                payload_hash=event.payload_hash,
                event_type=event.event_type,
                action=event.action,
                timestamp_str=timestamp_str
            )
            if recomputed_current_hash != event.current_hash:
                return {
                    "is_valid": False,
                    "tampered_event_id": event.id,
                    "reason": f"Cryptographic signature mismatch at Event #{event.id}.",
                    "total_events_checked": len(events)
                }

            expected_prev_hash = event.current_hash

        return {
            "is_valid": True,
            "total_events": len(events),
            "chain_head": events[-1].current_hash,
            "status": "VERIFIED_INTEGRITY"
        }
