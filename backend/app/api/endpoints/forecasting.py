from fastapi import APIRouter, Query, Depends
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import MandiPriceRecord
from app.services.agmarknet_service import AgmarknetService
from app.services.weather_service import WeatherService
from app.engines.forecasting_engine import DemandForecastingEngine

router = APIRouter()

REGION_COORDINATES = {
    "Delhi-NCR": (28.6139, 77.2090),
    "Punjab": (30.9010, 75.8573),
    "Ludhiana": (30.9010, 75.8573),
    "Maharashtra": (19.9975, 73.7898),
    "Nashik": (19.9975, 73.7898),
    "Karnataka": (13.1367, 78.1292),
    "Kolar": (13.1367, 78.1292),
    "Uttar Pradesh": (27.1767, 78.0081),
    "Agra": (27.1767, 78.0081),
    "Bihar": (26.1209, 85.3647),
    "Muzaffarpur": (26.1209, 85.3647)
}

@router.get("/mandi-prices")
async def get_mandi_prices(
    commodity: Optional[str] = Query(None, description="e.g. Wheat, Tomato, Onion"),
    state: Optional[str] = Query(None, description="e.g. Punjab, Delhi, Maharashtra")
):
    """Retrieve raw/cached mandi prices from Agmarknet service."""
    return await AgmarknetService.fetch_mandi_prices(commodity=commodity, state=state)

@router.get("/demand-forecast")
async def get_demand_forecast(
    commodity: str = Query("Tomato", description="Commodity name"),
    region: str = Query("Delhi-NCR", description="Target region"),
    days_ahead: int = Query(14, ge=7, le=30),
    model_type: str = Query("auto", description="auto, ridge_ml, holt_winters, moving_average, naive"),
    db: Session = Depends(get_db)
):
    """
    Generate 14-day multi-model time-series price & demand forecast with backtest evaluation metrics (MAE, RMSE, MAPE) and OpenMeteo weather telemetry.
    """
    # 1. First check canonical database records
    historical_records = []
    try:
        db_records = db.query(MandiPriceRecord).filter(
            MandiPriceRecord.commodity.ilike(f"%{commodity}%")
        ).order_by(MandiPriceRecord.record_date.desc()).limit(60).all()

        if db_records and len(db_records) >= 7:
            for r in reversed(db_records):
                historical_records.append({
                    "modal_price": r.price_per_kg,
                    "arrival_tonnes": r.arrival_tonnes,
                    "record_date": r.record_date
                })
    except Exception:
        db.rollback()
        historical_records = []

    if not historical_records:
        # Fall back to external service / dataset
        historical_records = await AgmarknetService.fetch_mandi_prices(commodity=commodity)

    # 2. Fetch real weather telemetry for the target region
    lat, lng = REGION_COORDINATES.get(region, (28.6139, 77.2090))
    weather_info = await WeatherService.get_regional_weather(lat, lng)

    # 3. Execute multi-model time-series forecasting with backtesting
    forecast_result = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name=commodity,
        region=region,
        historical_records=historical_records,
        days_ahead=days_ahead,
        preferred_model=model_type,
        weather_telemetry={
            "temperature": weather_info.get("temperature_celsius", 28.0),
            "rainfall_mm": weather_info.get("rainfall_mm", 0.0),
            "humidity": weather_info.get("relative_humidity_percent", 65.0)
        }
    )

    forecast_result["weather_telemetry"] = weather_info
    return forecast_result

@router.get("/models-benchmark")
async def get_models_benchmark(
    commodity: str = Query("Tomato", description="Commodity name"),
    region: str = Query("Delhi-NCR", description="Target region"),
    db: Session = Depends(get_db)
):
    """
    Evaluate and compare Naive, Moving Average, Holt-Winters, and Ridge ML time-series models on historical data.
    """
    forecast = await get_demand_forecast(
        commodity=commodity,
        region=region,
        days_ahead=14,
        model_type="auto",
        db=db
    )
    return {
        "commodity": commodity,
        "region": region,
        "active_model": forecast["active_model"],
        "baseline_comparison": forecast["baseline_comparison"],
        "model_metrics": forecast["model_metrics"],
        "data_provenance": forecast["data_provenance"]
    }
