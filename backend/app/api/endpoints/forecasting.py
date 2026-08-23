from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from app.services.agmarknet_service import AgmarknetService
from app.engines.forecasting_engine import DemandForecastingEngine

router = APIRouter()

@router.get("/mandi-prices")
async def get_mandi_prices(
    commodity: Optional[str] = Query(None, description="e.g. Wheat, Tomato, Onion"),
    state: Optional[str] = Query(None, description="e.g. Punjab, Delhi, Maharashtra")
):
    return await AgmarknetService.fetch_mandi_prices(commodity=commodity, state=state)

@router.get("/demand-forecast")
async def get_demand_forecast(
    commodity: str = Query("Tomato", description="Commodity name"),
    region: str = Query("Delhi-NCR", description="Target region"),
    days_ahead: int = Query(14, ge=7, le=30)
):
    records = await AgmarknetService.fetch_mandi_prices(commodity=commodity)
    return DemandForecastingEngine.forecast_commodity_demand(
        commodity_name=commodity,
        region=region,
        historical_records=records,
        days_ahead=days_ahead
    )
