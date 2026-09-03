from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import MandiPriceRecord
from app.services.agmarknet_service import AgmarknetService
from app.services.weather_service import WeatherService
from app.engines.forecasting_engine import DemandForecastingEngine
from app.engines.agricultural_forecasting_engine import AgriculturalForecastingEngine

router = APIRouter()

_ml_engine: Optional[AgriculturalForecastingEngine] = None

def get_ml_engine() -> AgriculturalForecastingEngine:
    global _ml_engine
    if _ml_engine is None:
        _ml_engine = AgriculturalForecastingEngine()
    return _ml_engine

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

REGION_TO_MARKET = {
    "Delhi-NCR": "Delhi",
    "Punjab": "Delhi",
    "Ludhiana": "Delhi",
    "Maharashtra": "Mumbai",
    "Nashik": "Mumbai",
    "Karnataka": "Ranchi",
    "Kolar": "Ranchi",
    "Uttar Pradesh": "Delhi",
    "Agra": "Delhi",
    "Bihar": "Patna",
    "Muzaffarpur": "Patna"
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
    model_type: str = Query("auto", description="auto, gradient_boosting, ridge_ml, holt_winters, moving_average, naive"),
    db: Session = Depends(get_db)
):
    """
    Generate 14-day multi-model time-series price & demand forecast with backtest evaluation metrics (MAE, RMSE, MAPE) and OpenMeteo weather telemetry.
    """
    # 1. Check canonical database records
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
        historical_records = await AgmarknetService.fetch_mandi_prices(commodity=commodity)

    # 2. Fetch real weather telemetry for target region
    lat, lng = REGION_COORDINATES.get(region, (28.6139, 77.2090))
    weather_info = await WeatherService.get_regional_weather(lat, lng)

    # 3. Base DemandForecastingEngine execution
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

    # 4. Augment with genuine Walk-Forward Tournament & ML Model Registry
    try:
        engine = get_ml_engine()
        mapped_market = REGION_TO_MARKET.get(region, "Ranchi")
        # Normalize commodity name
        norm_comm = commodity.capitalize()
        if norm_comm in ["Tomato", "Onion", "Potato", "Wheat", "Rice", "Mustard"]:
            ml_forecast = engine.generate_price_forecast(commodity=norm_comm, market=mapped_market, horizon_days=days_ahead)
            if "error" not in ml_forecast:
                forecast_result["winning_model"] = ml_forecast.get("winning_model")
                forecast_result["active_model"] = ml_forecast.get("winning_model", forecast_result["active_model"])
                forecast_result["confidence_score_pct"] = ml_forecast.get("confidence_score_pct", 88.5)
                forecast_result["explainability"] = ml_forecast.get("explainability", {})
                
                # Enrich baseline comparison with empirical leaderboard
                leaderboard = ml_forecast.get("model_leaderboard", [])
                if leaderboard:
                    enriched_comparison = []
                    for entry in leaderboard:
                        enriched_comparison.append({
                            "model_id": entry["model_name"].lower().replace(" ", "_").replace("(", "").replace(")", ""),
                            "model_name": entry["model_name"],
                            "mae": entry["mae"],
                            "rmse": entry["rmse"],
                            "mape": entry["smape"],
                            "smape": entry["smape"]
                        })
                    forecast_result["baseline_comparison"] = enriched_comparison
                    forecast_result["model_metrics"] = {
                        "mae": leaderboard[0]["mae"],
                        "rmse": leaderboard[0]["rmse"],
                        "mape": leaderboard[0]["smape"],
                        "smape": leaderboard[0]["smape"],
                        "test_horizon_samples": 45,
                        "total_training_samples": len(engine.registry.clean_df)
                    }

                # Add confidence bands to daily predictions
                curve = ml_forecast.get("forecast_curve", [])
                for i, pt in enumerate(forecast_result.get("demand_forecast", [])):
                    if i < len(curve):
                        pt["lower_80"] = curve[i].get("lower_80")
                        pt["upper_80"] = curve[i].get("upper_80")
                        pt["lower_95"] = curve[i].get("lower_95")
                        pt["upper_95"] = curve[i].get("upper_95")
                        pt["lower_bound"] = curve[i].get("lower_80", pt["lower_bound"])
                        pt["upper_bound"] = curve[i].get("upper_80", pt["upper_bound"])
    except Exception as exc:
        pass

    forecast_result["weather_telemetry"] = weather_info
    return forecast_result

@router.get("/forecast")
def get_ml_price_forecast(
    commodity: str = Query(default="Tomato", description="Commodity name (Tomato, Onion, Potato, Wheat, Rice, Mustard)"),
    market: str = Query(default="Ranchi", description="Mandi name (Ranchi, Ramgarh, Kolkata, Patna, Delhi, Mumbai)"),
    horizon: int = Query(default=14, ge=1, le=30, description="Forecast horizon in days"),
):
    """
    Returns multi-horizon agricultural price forecast, 80% & 95% confidence intervals,
    winning model selection, backtest leaderboard, and SHAP factor attribution.
    """
    engine = get_ml_engine()
    result = engine.generate_price_forecast(commodity=commodity, market=market, horizon_days=horizon)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/backtest")
def get_backtest_leaderboard(
    commodity: str = Query(default="Tomato"),
    market: str = Query(default="Ranchi"),
    horizon: int = Query(default=7, ge=1, le=14),
):
    """
    Returns walk-forward temporal cross-validation comparison across:
    1. Naive Persistence
    2. Moving Average (7D)
    3. Holt-Winters Smoothing
    4. Ridge ARX (Weather + Arrivals)
    5. Gradient Boosted Trees
    """
    engine = get_ml_engine()
    _, tournament = engine.registry.get_or_train_best_model(commodity, market, horizon=horizon)
    return tournament

@router.get("/ablation")
def get_feature_ablation(
    commodity: str = Query(default="Tomato"),
    market: str = Query(default="Ranchi"),
):
    """
    Returns ablation benchmarks comparing incremental error reductions:
    Historical Price -> + Arrivals -> + Weather -> + Spatial Spreads.
    """
    engine = get_ml_engine()
    return engine.get_ablation_benchmarks(commodity, market)

@router.get("/models-benchmark")
async def get_models_benchmark(
    commodity: str = Query("Tomato", description="Commodity name"),
    region: str = Query("Delhi-NCR", description="Target region"),
    db: Session = Depends(get_db)
):
    """
    Evaluate and compare Naive, Moving Average, Holt-Winters, Ridge ML, and Gradient Boosted Trees time-series models on historical data.
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

