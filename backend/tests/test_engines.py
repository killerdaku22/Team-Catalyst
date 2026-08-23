import pytest
from app.engines.price_engine import FairPriceEngine
from app.engines.forecasting_engine import DemandForecastingEngine
from app.engines.logistics_engine import LogisticsOptimizationEngine

def test_fair_price_engine_calculation():
    result = FairPriceEngine.calculate_price_breakdown(
        farmer_target_price_per_kg=25.0,
        quantity_kg=1000.0,
        distance_km=100.0,
        middleman_baseline_price_per_kg=18.0,
        consumer_benchmark_retail_price_per_kg=40.0
    )
    
    assert result["total_farmer_payout_direct"] == 25000.0
    assert result["total_farmer_payout_middleman"] == 18000.0
    assert result["farmer_earnings_uplift_amount"] == 7000.0
    assert result["farmer_earnings_uplift_percent"] > 30.0
    assert result["consumer_savings_amount"] > 0
    assert result["disintermediation_efficiency_score"] > 0

def test_demand_forecasting_engine():
    historical = [
        {"modal_price": 25.0, "arrival_tonnes": 200, "date": "2026-08-01"},
        {"modal_price": 26.0, "arrival_tonnes": 190, "date": "2026-08-02"},
        {"modal_price": 27.5, "arrival_tonnes": 175, "date": "2026-08-03"},
        {"modal_price": 28.0, "arrival_tonnes": 160, "date": "2026-08-04"},
        {"modal_price": 29.0, "arrival_tonnes": 150, "date": "2026-08-05"}
    ]
    forecast = DemandForecastingEngine.forecast_commodity_demand(
        commodity_name="Tomato",
        region="Delhi-NCR",
        historical_records=historical,
        days_ahead=7
    )
    
    assert forecast["commodity"] == "Tomato"
    assert len(forecast["demand_forecast"]) == 7
    assert "key_drivers" in forecast
    assert forecast["price_volatility_percent"] >= 0

def test_logistics_optimization_engine():
    pickups = [
        {"name": "Farm A", "latitude": 30.9010, "longitude": 75.8573, "quantity_kg": 1200},
        {"name": "Farm B", "latitude": 30.7333, "longitude": 76.7794, "quantity_kg": 1500}
    ]
    destination = {"name": "Delhi Consumer Hub", "latitude": 28.6139, "longitude": 77.2090}

    result = LogisticsOptimizationEngine.optimize_pooled_route(
        pickups=pickups,
        destination=destination,
        max_vehicle_capacity_kg=5000.0
    )

    assert result["stops_count"] == 3
    assert result["total_weight_kg"] == 2700.0
    assert result["total_distance_km"] > 0
    assert result["co2_saved_kg"] >= 0
