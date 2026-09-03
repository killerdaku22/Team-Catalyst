"""
Agricultural Data Analytics & Market Intelligence Engine
Computes market KPIs, price & arrival momentum, volatility indices, market signals
(spikes, crashes, supply shocks), and cross-mandi arbitrage profitability.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.ml.training.model_registry import ModelRegistry


class DataAnalyticsEngine:
    """
    Data Analytics & Market Signal Engine for AgriDirect.
    """

    MANDI_COORDINATES = {
        "Ranchi": {"lat": 23.3441, "lon": 85.3096},
        "Ramgarh": {"lat": 23.6332, "lon": 85.5139},
        "Kolkata": {"lat": 22.5726, "lon": 88.3639},
        "Patna": {"lat": 25.5941, "lon": 85.1376},
        "Delhi": {"lat": 28.7041, "lon": 77.1025},
        "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    }

    # Freight cost: ₹2.1 per ton-km = ₹0.0021 per kg-km
    FREIGHT_COST_PER_KG_KM = 0.0021

    def __init__(self, registry: Optional[ModelRegistry] = None):
        self.registry = registry or ModelRegistry()

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes geodesic distance in kilometers between two lat/lon coordinates."""
        r = 6371.0
        phi1, phi2 = np.radians(lat1), np.radians(lat2)
        dphi = np.radians(lat2 - lat1)
        dlambda = np.radians(lon2 - lon1)
        a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2) ** 2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return float(r * c)

    def get_market_analytics(self, commodity: str, market: str) -> Dict[str, Any]:
        """
        Computes clean market intelligence statistics and real-time signals.
        """
        df = self.registry.clean_df
        sub = df[(df["commodity"] == commodity) & (df["market"] == market)].sort_values("date").reset_index(drop=True)

        if sub.empty:
            return {"error": f"No data available for {commodity} in {market}"}

        latest_row = sub.iloc[-1]
        current_price = float(latest_row["modal_price"])
        current_arrival = float(latest_row["arrival_quantity"])
        latest_date = str(latest_row["date"])[:10]

        # Historical price changes
        p_1d = float(sub.iloc[-2]["modal_price"]) if len(sub) >= 2 else current_price
        p_7d = float(sub.iloc[-8]["modal_price"]) if len(sub) >= 8 else current_price
        p_30d = float(sub.iloc[-31]["modal_price"]) if len(sub) >= 31 else current_price

        chg_1d_pct = round(((current_price - p_1d) / max(0.1, p_1d)) * 100.0, 2)
        chg_7d_pct = round(((current_price - p_7d) / max(0.1, p_7d)) * 100.0, 2)
        chg_30d_pct = round(((current_price - p_30d) / max(0.1, p_30d)) * 100.0, 2)

        # Arrival changes
        arr_7d = float(sub.iloc[-8]["arrival_quantity"]) if len(sub) >= 8 else current_arrival
        arr_chg_7d_pct = round(((current_arrival - arr_7d) / max(0.1, arr_7d)) * 100.0, 2)

        # Volatility Index (30-day price standard deviation / mean)
        last_30_prices = sub["modal_price"].tail(30).values
        volatility_ratio = float(np.std(last_30_prices) / max(0.1, np.mean(last_30_prices)))
        if volatility_ratio < 0.08:
            volatility_class = "LOW"
        elif volatility_ratio < 0.18:
            volatility_class = "MODERATE"
        else:
            volatility_class = "HIGH"

        # Market trend classification
        if chg_7d_pct > 3.0:
            trend = "BULLISH (UPWARD)"
        elif chg_7d_pct < -3.0:
            trend = "BEARISH (DOWNWARD)"
        else:
            trend = "STABLE / CONSOLIDATING"

        # Signal detection
        signals: List[Dict[str, Any]] = []

        # 1. Supply Shock Detection: Arrivals down >= 15% and Price up >= 6%
        if arr_chg_7d_pct <= -15.0 and chg_7d_pct >= 6.0:
            signals.append({
                "type": "SUPPLY_SHOCK",
                "severity": "CRITICAL",
                "title": "Supply Shock Detected",
                "description": f"Arrivals dropped by {abs(arr_chg_7d_pct)}% while modal price surged {chg_7d_pct}% over the past 7 days."
            })

        # 2. Oversupply / Harvest Glut: Arrivals up >= 25% and Price down >= 6%
        elif arr_chg_7d_pct >= 25.0 and chg_7d_pct <= -6.0:
            signals.append({
                "type": "HARVEST_GLUT",
                "severity": "WARNING",
                "title": "Harvest Glut / Oversupply",
                "description": f"Heavy arrivals surge (+{arr_chg_7d_pct}%) putting downward pressure ({chg_7d_pct}%) on local mandi prices."
            })

        # 3. Sudden Price Spike (> 12% in 7 days)
        if chg_7d_pct >= 12.0:
            signals.append({
                "type": "PRICE_SPIKE",
                "severity": "ALERT",
                "title": "Price Surge Alert",
                "description": f"Sharp upward acceleration of {chg_7d_pct}% over 7 days. High storage profitability opportunity."
            })

        # 4. Heavy Deluge / Transport Disruption
        latest_rain = float(latest_row.get("rainfall", 0.0))
        if latest_rain >= 30.0:
            signals.append({
                "type": "WEATHER_DISRUPTION",
                "severity": "WARNING",
                "title": "Heavy Precipitation In Corridor",
                "description": f"Recorded rainfall of {latest_rain}mm. Transport transit delays and elevated perishable spoilage risks expected."
            })

        if not signals:
            signals.append({
                "type": "NORMAL_MARKET",
                "severity": "INFO",
                "title": "Orderly Market Conditions",
                "description": "Stable arrivals and balanced wholesale equilibrium with normal price dispersion."
            })

        # 30-day historical series for visual graphs
        hist_records = []
        for _, row in sub.tail(30).iterrows():
            hist_records.append({
                "date": str(row["date"])[:10],
                "modal_price": float(row["modal_price"]),
                "min_price": float(row["min_price"]),
                "max_price": float(row["max_price"]),
                "arrival_quantity": float(row["arrival_quantity"]),
                "temperature": float(row.get("temperature", 25.0)),
                "rainfall": float(row.get("rainfall", 0.0)),
            })

        return {
            "commodity": commodity,
            "market": market,
            "latest_date": latest_date,
            "current_price_rs_kg": current_price,
            "current_arrival_quintals": current_arrival,
            "price_changes_pct": {
                "1_day": chg_1d_pct,
                "7_day": chg_7d_pct,
                "30_day": chg_30d_pct,
            },
            "arrival_change_7d_pct": arr_chg_7d_pct,
            "volatility_index": round(volatility_ratio, 3),
            "volatility_class": volatility_class,
            "market_trend": trend,
            "active_signals": signals,
            "recent_30d_history": hist_records,
        }

    def compute_cross_mandi_arbitrage(
        self, origin_market: str, commodity: str
    ) -> List[Dict[str, Any]]:
        """
        Evaluates real-time price arbitrage across distant mandis, penalizing for
        freight haulage distance and ambient heat spoilage.
        """
        df = self.registry.clean_df
        latest_date = df["date"].max()
        today_df = df[(df["date"] == latest_date) & (df["commodity"] == commodity)]

        if origin_market not in self.MANDI_COORDINATES:
            origin_coords = {"lat": 23.3441, "lon": 85.3096}
        else:
            origin_coords = self.MANDI_COORDINATES[origin_market]

        origin_row = today_df[today_df["market"] == origin_market]
        if origin_row.empty:
            origin_price = 25.0
        else:
            origin_price = float(origin_row.iloc[0]["modal_price"])

        destinations = []
        for _, row in today_df.iterrows():
            dest_market = row["market"]
            if dest_market == origin_market:
                continue

            dest_price = float(row["modal_price"])
            dest_coords = self.MANDI_COORDINATES.get(dest_market, {"lat": 22.5726, "lon": 88.3639})

            distance_km = self.haversine_distance(
                origin_coords["lat"], origin_coords["lon"],
                dest_coords["lat"], dest_coords["lon"]
            )
            # Road detour factor ~ 1.25x geodesic
            road_distance_km = round(distance_km * 1.25, 1)

            # Freight cost: ₹0.0021 / kg-km
            freight_cost_rs_kg = round(road_distance_km * self.FREIGHT_COST_PER_KG_KM, 2)

            # Transit heat spoilage penalty (approx 0.0015% per km for perishables like Tomato)
            spoilage_rate = 0.0018 if commodity in ["Tomato", "Onion"] else 0.0004
            spoilage_cost_rs_kg = round(origin_price * spoilage_rate * (road_distance_km / 100.0), 2)

            gross_spread = round(dest_price - origin_price, 2)
            net_realization_spread = round(gross_spread - freight_cost_rs_kg - spoilage_cost_rs_kg, 2)

            is_profitable = net_realization_spread > 0.50

            destinations.append({
                "origin_market": origin_market,
                "destination_market": dest_market,
                "origin_price_rs_kg": origin_price,
                "destination_price_rs_kg": dest_price,
                "gross_spread_rs_kg": gross_spread,
                "road_distance_km": road_distance_km,
                "freight_cost_rs_kg": freight_cost_rs_kg,
                "spoilage_cost_rs_kg": spoilage_cost_rs_kg,
                "net_profit_rs_kg": net_realization_spread,
                "is_arbitrage_profitable": is_profitable,
                "recommendation": "DISPATCH_PROFITABLE" if is_profitable else "SELL_LOCALLY",
            })

        # Rank by highest net profit
        destinations.sort(key=lambda x: x["net_profit_rs_kg"], reverse=True)
        return destinations
