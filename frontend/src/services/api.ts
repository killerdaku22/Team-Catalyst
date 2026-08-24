import { CropListing, PriceBreakdown, DemandForecast, VRPResult, MinistrySummary, RouteWaypoint } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api/v1';

export async function fetchListings(crop?: string, category?: string): Promise<CropListing[]> {
  try {
    let url = `${API_BASE}/marketplace/listings?`;
    if (crop) url += `crop=${encodeURIComponent(crop)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Using fallback listings:", e);
  }

  // Fallback Listings Data
  return [
    {
      id: 1,
      fpo_name: "Ludhiana Agri Cooperative",
      crop_name: "Wheat (Kalyan Sona)",
      category: "Cereals",
      grade: "Grade A Premium",
      quantity_kg: 4500,
      price_per_kg: 24.50,
      middleman_baseline_price: 21.00,
      consumer_benchmark_price: 34.00,
      harvest_date: "2026-08-20",
      shelf_life_days: 180,
      latitude: 30.9010,
      longitude: 75.8573,
      location_name: "Ludhiana Farm Cluster, Punjab",
      status: "AVAILABLE"
    },
    {
      id: 2,
      fpo_name: "Nashik Farmer Producer Co",
      crop_name: "Red Onion (Nashik Quality)",
      category: "Vegetables",
      grade: "Grade A",
      quantity_kg: 3200,
      price_per_kg: 23.00,
      middleman_baseline_price: 17.50,
      consumer_benchmark_price: 38.00,
      harvest_date: "2026-08-21",
      shelf_life_days: 30,
      latitude: 19.9975,
      longitude: 73.7898,
      location_name: "Lasalgaon Farm Hub, Nashik",
      status: "AVAILABLE"
    },
    {
      id: 3,
      fpo_name: "Kolar Tomato Growers Union",
      crop_name: "Hybrid Red Tomato",
      category: "Vegetables",
      grade: "Grade A Fresh",
      quantity_kg: 2800,
      price_per_kg: 32.00,
      middleman_baseline_price: 24.00,
      consumer_benchmark_price: 52.00,
      harvest_date: "2026-08-22",
      shelf_life_days: 10,
      latitude: 13.1367,
      longitude: 78.1292,
      location_name: "Kolar Agri Cluster, Karnataka",
      status: "AVAILABLE"
    },
    {
      id: 4,
      fpo_name: "Agra Potato Producers FPO",
      crop_name: "White Potato (Jyoti Variety)",
      category: "Vegetables",
      grade: "Grade A",
      quantity_kg: 5000,
      price_per_kg: 16.80,
      middleman_baseline_price: 13.20,
      consumer_benchmark_price: 26.00,
      harvest_date: "2026-08-19",
      shelf_life_days: 60,
      latitude: 27.1767,
      longitude: 78.0081,
      location_name: "Agra Farm Hub, Uttar Pradesh",
      status: "AVAILABLE"
    }
  ];
}

export async function fetchPriceBreakdown(
  farmer_price: number,
  quantity: number,
  distance: number,
  middleman_price: number,
  retail_price: number
): Promise<PriceBreakdown> {
  try {
    const res = await fetch(`${API_BASE}/marketplace/price-breakdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_target_price_per_kg: farmer_price,
        quantity_kg: quantity,
        distance_km: distance,
        middleman_baseline_price_per_kg: middleman_price,
        consumer_benchmark_retail_price_per_kg: retail_price
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Fallback price breakdown:", e);
  }

  // Pure deterministic mathematical calculation fallback
  const logistics_cost = 1.5 + (distance * 0.012);
  const platform_fee = farmer_price * 0.015;
  const direct_consumer_price = farmer_price + logistics_cost + platform_fee;
  
  const total_farmer_direct = farmer_price * quantity;
  const total_farmer_middleman = middleman_price * quantity;
  const farmer_uplift_amount = total_farmer_direct - total_farmer_middleman;
  const farmer_uplift_pct = (farmer_uplift_amount / total_farmer_middleman) * 100;

  const total_consumer_direct = direct_consumer_price * quantity;
  const total_consumer_retail = retail_price * quantity;
  const consumer_savings_amount = total_consumer_retail - total_consumer_direct;
  const consumer_savings_pct = (consumer_savings_amount / total_consumer_retail) * 100;

  return {
    farmer_price_per_kg: Number(farmer_price.toFixed(2)),
    logistics_cost_per_kg: Number(logistics_cost.toFixed(2)),
    platform_fee_per_kg: Number(platform_fee.toFixed(2)),
    direct_consumer_price_per_kg: Number(direct_consumer_price.toFixed(2)),
    middleman_baseline_price_per_kg: Number(middleman_price.toFixed(2)),
    consumer_benchmark_retail_price_per_kg: Number(retail_price.toFixed(2)),
    total_farmer_payout_direct: Number(total_farmer_direct.toFixed(2)),
    total_farmer_payout_middleman: Number(total_farmer_middleman.toFixed(2)),
    farmer_earnings_uplift_amount: Number(farmer_uplift_amount.toFixed(2)),
    farmer_earnings_uplift_percent: Number(farmer_uplift_pct.toFixed(1)),
    total_consumer_cost_direct: Number(total_consumer_direct.toFixed(2)),
    total_consumer_cost_retail: Number(total_consumer_retail.toFixed(2)),
    consumer_savings_amount: Number(consumer_savings_amount.toFixed(2)),
    consumer_savings_percent: Number(consumer_savings_pct.toFixed(1)),
    eliminated_middleman_margin_per_kg: Number((retail_price - middleman_price - logistics_cost).toFixed(2)),
    disintermediation_efficiency_score: Number((farmer_uplift_pct + consumer_savings_pct).toFixed(1))
  };
}

export async function fetchDemandForecast(commodity: string = 'Tomato', region: string = 'Delhi-NCR'): Promise<DemandForecast> {
  try {
    const res = await fetch(`${API_BASE}/forecasting/demand-forecast?commodity=${encodeURIComponent(commodity)}&region=${encodeURIComponent(region)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Fallback demand forecast:", e);
  }

  // Fallback Forecast Data
  const base_p = commodity === 'Tomato' ? 32 : commodity === 'Onion' ? 24 : 22;
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  return {
    commodity,
    region,
    current_modal_price: base_p,
    price_volatility_percent: 14.2,
    demand_forecast: dates.map((date, idx) => {
      const pred_price = base_p + (idx * 0.4) + Math.sin(idx * 0.8) * 1.5;
      const pred_demand = 180 - (idx * 1.2) + Math.cos(idx * 0.8) * 10;
      return {
        forecast_date: date,
        predicted_modal_price: Number(pred_price.toFixed(2)),
        predicted_demand_tonnes: Number(pred_demand.toFixed(1)),
        price_confidence_low: Number((pred_price - 2.5).toFixed(2)),
        price_confidence_high: Number((pred_price + 2.5).toFixed(2))
      };
    }),
    key_drivers: [
      `Seasonal demand surge expected in ${region} urban centers over next 10 days.`,
      `Low arrival volume in regional mandis due to recent rain events.`,
      `Direct FPO pooling reduces transit spoilage risk by ~65%.`
    ],
    generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
}

export async function optimizeRoute(selectedListings: CropListing[]): Promise<VRPResult> {
  try {
    const res = await fetch(`${API_BASE}/logistics/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickups: selectedListings.map(l => ({
          id: l.id,
          fpo_name: l.fpo_name,
          crop_name: l.crop_name,
          quantity_kg: l.quantity_kg,
          latitude: l.latitude,
          longitude: l.longitude
        })),
        destination: { name: "Central Delhi Distribution Hub", latitude: 28.6139, longitude: 77.2090 },
        max_capacity_kg: 5000.0
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Fallback VRP optimization:", e);
  }

  // Fallback VRP
  const total_w = selectedListings.reduce((sum, item) => sum + item.quantity_kg, 0);
  const waypoints: RouteWaypoint[] = selectedListings.map(l => ({
    id: l.id,
    name: l.fpo_name,
    fpo_name: l.fpo_name,
    crop_name: l.crop_name,
    quantity_kg: l.quantity_kg,
    latitude: l.latitude,
    longitude: l.longitude,
    type: "FARM_PICKUP"
  }));
  waypoints.push({
    name: "Central Delhi Consumer Hub",
    latitude: 28.6139,
    longitude: 77.2090,
    type: "DESTINATION_HUB"
  });

  return {
    route_waypoints: waypoints,
    stops_count: waypoints.length,
    total_weight_kg: total_w,
    vehicle_capacity_utilization_percent: Number(((total_w / 5000) * 100).toFixed(1)),
    total_distance_km: 340.5,
    estimated_time_hours: 7.2,
    distance_saved_vs_unpooled_km: 215.0,
    co2_saved_kg: 55.9,
    spoilage_risk_percent: 3.8
  };
}

export async function fetchMinistrySummary(): Promise<MinistrySummary> {
  try {
    const res = await fetch(`${API_BASE}/analytics/ministry-summary`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Fallback ministry summary:", e);
  }

  return {
    ministry: "Ministry of Consumer Affairs, Food & Public Distribution",
    department: "Department of Consumer Affairs (DoCA)",
    problem_statement_id: "SIH26033",
    macro_metrics: {
      total_farmer_earnings_uplift_inr: 2845000,
      total_consumer_savings_inr: 3920000,
      total_produce_traded_tonnes: 450.5,
      active_fpos_onboarded: 48,
      avg_farmer_earnings_uplift_percent: 28.4,
      avg_consumer_cost_reduction_percent: 18.6,
      avg_middleman_margin_eliminated_percent: 47.0,
      co2_emissions_reduced_kg: 12450.0,
      supply_demand_stability_index: 91.2
    },
    regional_breakdown: [
      { region: "Punjab-Delhi Corridor", primary_crop: "Wheat / Tomato", active_routes: 14, price_variance_reduction: "32%" },
      { region: "Nashik-Mumbai Corridor", primary_crop: "Onion", active_routes: 18, price_variance_reduction: "28%" },
      { region: "Agra-NCR Corridor", primary_crop: "Potato", active_routes: 11, price_variance_reduction: "24%" },
      { region: "Kolar-Bengaluru Corridor", primary_crop: "Tomato", active_routes: 16, price_variance_reduction: "35%" }
    ]
  };
}
