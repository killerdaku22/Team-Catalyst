import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MarketOpportunityRequestSchema(BaseModel):
    commodity: str
    quantity_kg: float = Field(..., gt=0)
    origin_location: str
    origin_latitude: float = Field(..., ge=-90.0, le=90.0)
    origin_longitude: float = Field(..., ge=-180.0, le=180.0)
    local_baseline_price_per_kg: float = Field(..., gt=0)
    shelf_life_days: int = Field(default=7, ge=1)
    ambient_temperature_celsius: float = Field(default=28.0)
    candidate_radius_km: float = Field(default=500.0, ge=10.0, le=2000.0)

class MarketOpportunityItem(BaseModel):
    rank: int
    destination_name: str
    destination_type: str # APMC_MANDI, INSTITUTIONAL_BUYER, PROCESSING_PLANT, RETAIL_COOPERATIVE
    state: str
    distance_km: float
    estimated_transit_hours: float
    gross_market_price_per_kg: float
    freight_cost_per_kg: float
    transit_spoilage_loss_per_kg: float
    mandi_handling_fee_per_kg: float
    net_realization_per_kg: float
    total_net_payout: float
    net_uplift_vs_local_per_kg: float
    net_uplift_amount_total: float
    net_uplift_percent: float
    recommendation_tier: str # TOP_OPPORTUNITY, ATTRACTIVE, MARGINAL, UNFAVORABLE

class OpportunityRankingResult(BaseModel):
    commodity: str
    quantity_kg: float
    origin_location: str
    local_baseline_price_per_kg: float
    local_net_revenue: float
    top_recommended_destination: str
    top_destination_type: str
    top_net_realization_per_kg: float
    max_net_uplift_total: float
    max_net_uplift_pct: float
    ranked_opportunities: List[MarketOpportunityItem]
    insights: List[str]

# Canonical network of major regional consumption centers & terminal markets
REGIONAL_MARKET_HUBS = [
    {"name": "Delhi Azadpur Terminal Mandi", "type": "APMC_MANDI", "state": "Delhi", "lat": 28.7159, "lng": 77.1788, "premium_factor": 1.32, "handling_rate": 0.35},
    {"name": "Mumbai Vashi APMC Terminal", "type": "APMC_MANDI", "state": "Maharashtra", "lat": 19.0760, "lng": 72.9986, "premium_factor": 1.28, "handling_rate": 0.40},
    {"name": "Bengaluru Yeshwanthpur Hub", "type": "APMC_MANDI", "state": "Karnataka", "lat": 13.0238, "lng": 77.5529, "premium_factor": 1.25, "handling_rate": 0.30},
    {"name": "Ludhiana Grain & Veg Market", "type": "APMC_MANDI", "state": "Punjab", "lat": 30.9010, "lng": 75.8573, "premium_factor": 1.10, "handling_rate": 0.25},
    {"name": "Nashik Lasalgaon APMC", "type": "APMC_MANDI", "state": "Maharashtra", "lat": 20.1472, "lng": 74.2272, "premium_factor": 1.18, "handling_rate": 0.25},
    {"name": "Agra Vegetable Mandi", "type": "APMC_MANDI", "state": "Uttar Pradesh", "lat": 27.1767, "lng": 78.0081, "premium_factor": 1.12, "handling_rate": 0.20},
    {"name": "Kolar Tomato APMC", "type": "APMC_MANDI", "state": "Karnataka", "lat": 13.1367, "lng": 78.1292, "premium_factor": 1.05, "handling_rate": 0.20},
    {"name": "BigBasket Regional Sourcing Hub", "type": "INSTITUTIONAL_BUYER", "state": "NCR / Haryana", "lat": 28.4595, "lng": 77.0266, "premium_factor": 1.38, "handling_rate": 0.15},
    {"name": "Reliance Fresh Central Distribution", "type": "INSTITUTIONAL_BUYER", "state": "Maharashtra", "lat": 19.1663, "lng": 73.0033, "premium_factor": 1.35, "handling_rate": 0.15},
    {"name": "Safal Mother Dairy Processing Plant", "type": "PROCESSING_PLANT", "state": "Delhi-NCR", "lat": 28.6328, "lng": 77.2197, "premium_factor": 1.30, "handling_rate": 0.10}
]

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

class MarketOpportunityEngine:
    """
    Multi-Market Net-Realization & Institutional Buyer Opportunity Ranking Engine.
    """

    @classmethod
    def rank_market_opportunities(cls, req: MarketOpportunityRequestSchema) -> OpportunityRankingResult:
        Q = req.quantity_kg
        P_local = req.local_baseline_price_per_kg
        local_net_revenue = round(Q * P_local, 2)
        origin_lat = req.origin_latitude
        origin_lng = req.origin_longitude
        ambient_temp = req.ambient_temperature_celsius

        evaluated_markets: List[MarketOpportunityItem] = []

        for hub in REGIONAL_MARKET_HUBS:
            dist = haversine_distance_km(origin_lat, origin_lng, hub["lat"], hub["lng"])
            if dist > req.candidate_radius_km and dist > 50.0:
                continue

            # Transit duration estimate (avg 45 km/h commercial freight)
            transit_hours = max(0.5, round(dist / 45.0, 1))

            # Freight cost: base handling ₹1.5/kg + ₹0.012/kg/km
            freight_cost_per_kg = round(1.5 + (dist * 0.012), 2)

            # Spoilage loss per kg (accelerates with ambient heat)
            temp_factor = 1.0 + max(0.0, (ambient_temp - 25.0) * 0.04)
            transit_spoilage_rate = min(0.08, 0.0015 * transit_hours * temp_factor)
            
            # Destination gross price
            gross_p = round(P_local * hub["premium_factor"], 2)
            spoilage_loss_per_kg = round(gross_p * transit_spoilage_rate, 2)
            mandi_handling_fee = hub["handling_rate"]

            # Net realization per kg
            net_realization = round(gross_p - freight_cost_per_kg - spoilage_loss_per_kg - mandi_handling_fee, 2)
            total_net_payout = round(net_realization * Q, 2)

            net_uplift_per_kg = round(net_realization - P_local, 2)
            net_uplift_total = round(total_net_payout - local_net_revenue, 2)
            net_uplift_pct = round((net_uplift_total / local_net_revenue) * 100.0, 1) if local_net_revenue > 0 else 0.0

            if net_uplift_pct > 15.0:
                tier = "TOP_OPPORTUNITY"
            elif net_uplift_pct > 5.0:
                tier = "ATTRACTIVE"
            elif net_uplift_pct >= 0.0:
                tier = "MARGINAL"
            else:
                tier = "UNFAVORABLE"

            evaluated_markets.append(MarketOpportunityItem(
                rank=0,
                destination_name=hub["name"],
                destination_type=hub["type"],
                state=hub["state"],
                distance_km=dist,
                estimated_transit_hours=transit_hours,
                gross_market_price_per_kg=gross_p,
                freight_cost_per_kg=freight_cost_per_kg,
                transit_spoilage_loss_per_kg=spoilage_loss_per_kg,
                mandi_handling_fee_per_kg=mandi_handling_fee,
                net_realization_per_kg=net_realization,
                total_net_payout=total_net_payout,
                net_uplift_vs_local_per_kg=net_uplift_per_kg,
                net_uplift_amount_total=net_uplift_total,
                net_uplift_percent=net_uplift_pct,
                recommendation_tier=tier
            ))

        # Rank strictly by net realization per kg descending
        evaluated_markets.sort(key=lambda m: m.net_realization_per_kg, reverse=True)
        for i, item in enumerate(evaluated_markets):
            item.rank = i + 1

        top_choice = evaluated_markets[0] if evaluated_markets else None

        # Insights
        insights = []
        if top_choice and top_choice.net_uplift_percent > 0:
            insights.append(f"Top Opportunity: '{top_choice.destination_name}' yields net ₹{top_choice.net_realization_per_kg}/kg (+₹{top_choice.net_uplift_amount_total:,.2f} total uplift vs local mandi).")
            if "INSTITUTIONAL" in top_choice.destination_type or "PROCESSING" in top_choice.destination_type:
                insights.append("Direct institutional buyer eliminates mandi middleman cess, saving ₹0.25/kg in transaction overhead.")
            insights.append(f"Logistics freight cost (₹{top_choice.freight_cost_per_kg}/kg) and transit spoilage (₹{top_choice.transit_spoilage_loss_per_kg}/kg) are fully offset by the {round((top_choice.gross_market_price_per_kg / P_local - 1)*100, 1)}% destination price premium.")
        else:
            insights.append(f"Local spot sale at {req.origin_location} remains optimal; long-haul freight costs exceed destination price premiums.")

        return OpportunityRankingResult(
            commodity=req.commodity,
            quantity_kg=Q,
            origin_location=req.origin_location,
            local_baseline_price_per_kg=P_local,
            local_net_revenue=local_net_revenue,
            top_recommended_destination=top_choice.destination_name if top_choice else "Local Mandi",
            top_destination_type=top_choice.destination_type if top_choice else "LOCAL",
            top_net_realization_per_kg=top_choice.net_realization_per_kg if top_choice else P_local,
            max_net_uplift_total=top_choice.net_uplift_amount_total if top_choice else 0.0,
            max_net_uplift_pct=top_choice.net_uplift_percent if top_choice else 0.0,
            ranked_opportunities=evaluated_markets,
            insights=insights
        )
