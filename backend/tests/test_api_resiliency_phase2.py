import pytest
import asyncio
from app.services.agmarknet_service import AgmarknetService
from app.services.weather_service import WeatherService
from app.services.routing_service import OSRMRoutingService

def test_agmarknet_resilience_and_caching():
    """Verify Agmarknet service returns structured records with explicit provenance and cache hits."""
    async def _run():
        # First call
        records = await AgmarknetService.fetch_mandi_prices(commodity="Tomato", state="Karnataka")
        assert len(records) > 0
        first_record = records[0]
        assert "modal_price" in first_record
        assert "provenance_source" in first_record
        assert first_record["price_unit"] == "INR/kg"

        # Second call should hit TTL cache
        cached_records = await AgmarknetService.fetch_mandi_prices(commodity="Tomato", state="Karnataka")
        assert cached_records == records
    asyncio.run(_run())

def test_weather_service_resilience_and_spoilage_multiplier():
    """Verify Weather service calculates spoilage multiplier and caches grid coordinates."""
    async def _run():
        # Kolar APMC coordinates
        weather = await WeatherService.get_regional_weather(latitude=13.1367, longitude=78.1291)
        assert "temperature_celsius" in weather
        assert "relative_humidity_percent" in weather
        assert "spoilage_risk_index" in weather
        assert "provenance_source" in weather
        assert weather["spoilage_risk_index"] >= 1.0

        # Cache hit
        cached_weather = await WeatherService.get_regional_weather(latitude=13.1367, longitude=78.1291)
        assert cached_weather["temperature_celsius"] == weather["temperature_celsius"]
    asyncio.run(_run())

def test_osrm_routing_service_resilience_and_haversine_fallback():
    """Verify OSRM routing service returns road geometry or falls back to Haversine."""
    async def _run():
        # Kolar to Bangalore APMC coordinates
        kolar_lng_lat = [78.1291, 13.1367]
        bangalore_lng_lat = [77.5946, 12.9716]
        
        route = await OSRMRoutingService.get_route_geometry([kolar_lng_lat, bangalore_lng_lat])
        assert route["distance_km"] > 0
        assert route["duration_minutes"] > 0
        assert "provenance_source" in route
        assert "provenance_status" in route
        assert route["geometry"]["type"] == "LineString"
    asyncio.run(_run())
