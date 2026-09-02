import sys
import os
sys.path.insert(0, os.path.abspath("."))
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import asyncio
import httpx
import json
import time
from datetime import datetime, timezone
from app.services.agmarknet_service import AgmarknetService
from app.services.weather_service import WeatherService
from app.services.routing_service import OSRMRoutingService
from app.services.data_quality_service import DataQualityService
from app.services.mandi_ingestion_service import MandiIngestionService
from app.engines.forecasting_engine import DemandForecastingEngine
from app.engines.decision_engine import AgriculturalDecisionEngine, BatchDecisionRequestSchema
from app.engines.market_opportunity_engine import MarketOpportunityEngine, MarketOpportunityRequestSchema
from app.engines.logistics_engine import LogisticsOptimizationEngine, RouteOptimizationRequest, PickupStopSchema
from app.db.database import SessionLocal
from app.db.models import MandiPriceRecord, CropListing, DirectOrder

async def test_live_weather():
    print("\n--- 1. Testing Weather Service (Open-Meteo) ---")
    Agra_lat, Agra_lng = 27.1767, 78.0081
    WeatherService._CACHE.clear()
    res = await WeatherService.get_regional_weather(Agra_lat, Agra_lng)
    print(f"Weather Result: temp={res.get('temperature_celsius')}°C, humidity={res.get('relative_humidity_percent')}%, rain={res.get('rainfall_mm')}mm")
    print(f"Provenance Source: {res.get('provenance_source')}")
    print(f"Provenance Status: {res.get('provenance_status')}")
    print(f"Timestamp: {res.get('observed_at')}")
    assert "provenance_status" in res
    assert res.get("provenance_status") in ["LIVE_OBSERVED", "CACHED_BENCHMARK"]
    return res

async def test_live_routing():
    print("\n--- 2. Testing OSRM Routing Service (OpenStreetMap) ---")
    # Coordinates: Delhi to Agra
    coords = [[77.2090, 28.6139], [78.0081, 27.1767]]
    OSRMRoutingService._CACHE.clear()
    res = await OSRMRoutingService.get_route_geometry(coords)
    print(f"Routing Result: distance={res.get('distance_km')} km, duration={res.get('duration_minutes')} mins")
    print(f"Provenance Source: {res.get('provenance_source')}")
    print(f"Provenance Status: {res.get('provenance_status')}")
    assert "distance_km" in res
    assert res["distance_km"] > 0
    return res

async def test_live_agmarknet():
    print("\n--- 3. Testing Agmarknet Service (data.gov.in) ---")
    AgmarknetService._CACHE.clear()
    res = await AgmarknetService.fetch_mandi_prices(commodity="Tomato")
    print(f"Agmarknet Records Count: {len(res)}")
    if res:
        sample = res[0]
        print(f"Sample Record: {sample.get('mandi_name')} | {sample.get('commodity')} | Rs {sample.get('modal_price')}/kg")
        print(f"Provenance Source: {sample.get('provenance_source')}")
        print(f"Provenance Status: {sample.get('provenance_status')}")
        print(f"Record Date: {sample.get('record_date')}")
        assert "provenance_status" in sample
    return res

def test_forecasting_pipeline():
    print("\n--- 4. Testing Multi-Model Forecasting Pipeline ---")
    hist_records = [
        {"modal_price": 28.0 + i*0.4 + (i%3)*0.5, "arrival_tonnes": 150.0 - i*1.2, "record_date": f"2026-08-{i+1:02d}"}
        for i in range(20)
    ]
    res = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name="Tomato",
        region="Delhi-NCR",
        historical_records=hist_records,
        days_ahead=14,
        weather_telemetry={"temperature": 31.0, "rainfall_mm": 5.0}
    )
    print(f"Active Selected Model: {res.get('active_model')}")
    print(f"Model Metrics: {res.get('model_metrics')}")
    print(f"Forecast Horizon: {len(res.get('demand_forecast', []))} days")
    print(f"Key Drivers: {res.get('key_drivers')}")
    print(f"Data Provenance: {res.get('data_provenance')}")
    assert res["active_model"] is not None
    assert len(res["demand_forecast"]) == 14
    return res

def test_decision_engine():
    print("\n--- 5. Testing Decision Engine (Pure Math & User-Derived Inputs) ---")
    req = BatchDecisionRequestSchema(
        commodity="Tomato",
        quantity_kg=4000.0,
        current_local_price_per_kg=28.0,
        shelf_life_days=10,
        storage_cost_per_kg_day=0.08,
        daily_spoilage_rate=0.005,
        forecasted_prices=[30.0, 31.5, 33.0, 34.2, 35.0, 36.0, 36.5, 37.0, 37.2, 36.8, 36.0, 35.5, 35.0, 34.5],
        min_cash_need_pct=25.0
    )
    res = AgriculturalDecisionEngine.evaluate_batch_decision(req)
    print(f"Optimal Action: {res.optimal_action}")
    print(f"Optimal Net Revenue: Rs {res.optimal_net_revenue:,.2f}")
    print(f"Net Uplift vs Local Sell Now: Rs {res.net_uplift_vs_local_sell_now:,.2f} (+{res.net_uplift_pct}%)")
    print(f"Options Evaluated: {[o.action for o in res.options_comparison]}")
    assert res.optimal_action in ["SELL_NOW", "STORE", "MOVE", "SPLIT"]
    return res

def test_database_and_analytics():
    print("\n--- 6. Testing Database Integrity & Macro Analytics ---")
    db = SessionLocal()
    try:
        listings_count = db.query(CropListing).count()
        orders_count = db.query(DirectOrder).count()
        mandi_count = db.query(MandiPriceRecord).count()
        print(f"Database Current Rows -> Listings: {listings_count}, Orders: {orders_count}, Mandi Records: {mandi_count}")
    finally:
        db.close()

async def main():
    print("===============================================================")
    print("        AGRIDIRECT LIVE DATA TRUTH & PIPELINE AUDIT            ")
    print("===============================================================")
    await test_live_weather()
    await test_live_routing()
    await test_live_agmarknet()
    test_forecasting_pipeline()
    test_decision_engine()
    test_database_and_analytics()
    print("\n===============================================================")
    print("        ALL DATA TRUTH TESTS EXECUTED SUCCESSFULLY!            ")
    print("===============================================================")

if __name__ == "__main__":
    asyncio.run(main())
