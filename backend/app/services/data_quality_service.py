import re
from datetime import datetime
from typing import Dict, Any, Tuple, List, Optional

COMMODITY_SYNONYMS: Dict[str, str] = {
    "tomato": "Tomato",
    "tomato local": "Tomato",
    "tomato hybrid": "Tomato",
    "onion": "Onion",
    "onion red": "Onion",
    "potato": "Potato",
    "potato local": "Potato",
    "wheat": "Wheat",
    "wheat (kalyan)": "Wheat",
    "paddy": "Paddy",
    "paddy(dhan)(common)": "Paddy",
    "bengal gram(gram)(whole)": "Gram",
    "gram": "Gram",
    "mustard": "Mustard",
    "mustard seed": "Mustard",
    "cucumbar(kheera)": "Cucumber",
    "cucumber": "Cucumber",
    "bottle gourd": "Bottle Gourd",
    "coriander(leaves)": "Coriander",
    "castor seed": "Castor Seed",
    "bajra(pearl millet/cumbu)": "Bajra",
    "apple": "Apple",
    "rice": "Rice"
}

class DataQualityService:
    """
    Data quality, normalization, and outlier detection engine for agricultural telemetry.
    """

    @staticmethod
    def normalize_commodity_name(raw_name: str) -> str:
        """Standardize raw commodity names to canonical names."""
        if not raw_name:
            return "Unknown"
        cleaned = raw_name.strip().lower()
        if cleaned in COMMODITY_SYNONYMS:
            return COMMODITY_SYNONYMS[cleaned]
        # Remove parenthetical descriptions (e.g. "Onion (Nasik)" -> "Onion")
        simplified = re.sub(r"\(.*?\)", "", cleaned).strip()
        if simplified in COMMODITY_SYNONYMS:
            return COMMODITY_SYNONYMS[simplified]
        return raw_name.strip().title()

    @staticmethod
    def normalize_date(raw_date: str) -> str:
        """Parse various date formats into standard ISO YYYY-MM-DD."""
        if not raw_date:
            return datetime.utcnow().strftime("%Y-%m-%d")
        cleaned = raw_date.strip()
        
        # Try known date formats
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y"):
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        # Fallback if unparseable
        return cleaned

    @classmethod
    def validate_and_clean_record(cls, record: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], List[str]]:
        """
        Validate, normalize, and detect anomalies in a raw mandi record.
        Returns: (is_valid, cleaned_record_dict, quality_flags)
        """
        quality_flags: List[str] = []
        
        state = str(record.get("state", "")).strip().title()
        district = str(record.get("district", "")).strip().title()
        mandi_name = str(record.get("mandi_name", "")).strip().title()
        raw_commodity = str(record.get("commodity", "")).strip()
        commodity = cls.normalize_commodity_name(raw_commodity)
        variety = str(record.get("variety", "FAQ")).strip()
        
        try:
            min_price_qtl = float(record.get("min_price", 0))
            max_price_qtl = float(record.get("max_price", 0))
            modal_price_qtl = float(record.get("modal_price", 0))
            arrival_tonnes = float(record.get("arrival_tonnes", 10.0))
        except (ValueError, TypeError):
            return False, None, ["INVALID_NUMERIC_VALUES"]

        raw_date = str(record.get("record_date", ""))
        record_date = cls.normalize_date(raw_date)

        # 1. Price non-negativity check
        if min_price_qtl <= 0 or max_price_qtl <= 0 or modal_price_qtl <= 0:
            return False, None, ["PRICE_NON_POSITIVE"]

        # 2. Inversion check: min_price must be <= max_price
        if min_price_qtl > max_price_qtl:
            quality_flags.append("PRICE_BAND_INVERTED_CORRECTED")
            min_price_qtl, max_price_qtl = max_price_qtl, min_price_qtl

        # Modal price sanity
        if modal_price_qtl < min_price_qtl:
            modal_price_qtl = min_price_qtl
            quality_flags.append("MODAL_CLAMPED_TO_MIN")
        elif modal_price_qtl > max_price_qtl:
            modal_price_qtl = max_price_qtl
            quality_flags.append("MODAL_CLAMPED_TO_MAX")

        # 3. Non-negative arrivals
        if arrival_tonnes < 0:
            return False, None, ["NEGATIVE_ARRIVAL_VOLUME"]

        # 4. Outlier detection (Price per kg check)
        price_per_kg = round(modal_price_qtl / 100.0, 2)
        if price_per_kg < 1.0 or price_per_kg > 1000.0:
            # Extreme pricing anomaly
            quality_flags.append("OUTLIER_PRICE_FLAGGED")
            if price_per_kg > 5000.0 or price_per_kg < 0.1:
                return False, None, ["EXTREME_OUTLIER_REJECTED"]

        # 5. Future date validation
        try:
            parsed_dt = datetime.strptime(record_date, "%Y-%m-%d")
            if parsed_dt.date() > datetime.utcnow().date():
                return False, None, ["FUTURE_DATE_REJECTED"]
        except ValueError:
            pass

        cleaned_record = {
            "state": state,
            "district": district,
            "mandi_name": mandi_name,
            "commodity": commodity,
            "variety": variety,
            "min_price": min_price_qtl,
            "max_price": max_price_qtl,
            "modal_price": modal_price_qtl,
            "price_per_kg": price_per_kg,
            "arrival_tonnes": arrival_tonnes,
            "record_date": record_date,
            "source": record.get("source", "HISTORICAL_CSV"),
            "quality_flags": quality_flags,
            "is_validated": True
        }

        return True, cleaned_record, quality_flags

    @staticmethod
    def get_deduplication_key(rec: Dict[str, Any]) -> str:
        """Generate canonical uniqueness hash key for record deduplication."""
        return f"{rec['state'].lower()}::{rec['mandi_name'].lower()}::{rec['commodity'].lower()}::{rec['record_date']}"
