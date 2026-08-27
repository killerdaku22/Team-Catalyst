from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class MandiRecordIn(BaseModel):
    state: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    mandi_name: str = Field(..., min_length=2, max_length=150)
    commodity: str = Field(..., min_length=2, max_length=100)
    variety: Optional[str] = "FAQ"
    min_price: float = Field(..., description="Price in Rs/Quintal")
    max_price: float = Field(..., description="Price in Rs/Quintal")
    modal_price: float = Field(..., description="Price in Rs/Quintal")
    arrival_tonnes: float = Field(default=10.0, ge=0.0)
    record_date: str = Field(..., description="Date in YYYY-MM-DD or DD/MM/YYYY")
    source: Optional[str] = "USER_PROVIDED"

class CanonicalMandiRecord(BaseModel):
    id: Optional[int] = None
    state: str
    district: str
    mandi_name: str
    commodity: str
    variety: Optional[str] = None
    min_price_qtl: float
    max_price_qtl: float
    modal_price_qtl: float
    price_per_kg: float
    arrival_tonnes: float
    record_date: str
    source: str
    is_validated: bool
    quality_flags: List[str] = []

    class Config:
        from_attributes = True

class IngestionReportSchema(BaseModel):
    total_processed: int
    valid_records_saved: int
    rejected_records: int
    duplicates_skipped: int
    data_sources: List[str]
    rejection_reasons: Dict[str, int]
    timestamp: str

class DataQualitySummarySchema(BaseModel):
    total_records: int
    validated_records_count: int
    data_health_score: float
    unique_commodities_count: int
    unique_mandis_count: int
    sources_breakdown: Dict[str, int]
    active_anomaly_count: int
