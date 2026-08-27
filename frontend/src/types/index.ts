export type UserRole = 'FPO' | 'BUYER' | 'LOGISTICS' | 'MINISTRY_ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  location_name?: string;
}

export interface CropListing {
  id: number;
  fpo_name: string;
  crop_name: string;
  category: string;
  grade: string;
  quantity_kg: number;
  price_per_kg: number;
  middleman_baseline_price: number;
  consumer_benchmark_price: number;
  harvest_date: string;
  shelf_life_days: number;
  latitude: number;
  longitude: number;
  location_name: string;
  status: 'AVAILABLE' | 'POOLED' | 'SOLD';
}

export interface PriceBreakdown {
  farmer_price_per_kg: number;
  logistics_cost_per_kg: number;
  platform_fee_per_kg: number;
  direct_consumer_price_per_kg: number;
  middleman_baseline_price_per_kg: number;
  consumer_benchmark_retail_price_per_kg: number;
  total_farmer_payout_direct: number;
  total_farmer_payout_middleman: number;
  farmer_earnings_uplift_amount: number;
  farmer_earnings_uplift_percent: number;
  total_consumer_cost_direct: number;
  total_consumer_cost_retail: number;
  consumer_savings_amount: number;
  consumer_savings_percent: number;
  eliminated_middleman_margin_per_kg: number;
  disintermediation_efficiency_score: number;
}

export interface ForecastPoint {
  forecast_date: string;
  predicted_modal_price: number;
  predicted_demand_tonnes: number;
  price_confidence_low: number;
  price_confidence_high: number;
  uncertainty_interval_pct?: number;
}

export interface ModelBenchmarkItem {
  model_id: string;
  model_name: string;
  mae: number;
  rmse: number;
  mape: number;
}

export interface DemandForecast {
  commodity: string;
  region: string;
  current_modal_price: number;
  historical_mean_price?: number;
  price_volatility_percent: number;
  forecast_horizon_days?: number;
  active_model?: string;
  model_metrics?: {
    mae: number;
    rmse: number;
    mape: number;
    test_horizon_samples: number;
    total_training_samples: number;
  };
  baseline_comparison?: ModelBenchmarkItem[];
  demand_forecast: ForecastPoint[];
  key_drivers: string[];
  weather_telemetry?: {
    temperature_celsius: number;
    relative_humidity_percent: number;
    rainfall_mm: number;
    spoilage_risk_index: number;
    status: string;
  };
  data_provenance?: string;
  generated_at: string;
}

export interface RouteWaypoint {
  id?: number;
  name: string;
  fpo_name?: string;
  crop_name?: string;
  quantity_kg?: number;
  latitude: number;
  longitude: number;
  type?: string;
}

export interface VRPResult {
  route_waypoints: RouteWaypoint[];
  stops_count: number;
  total_weight_kg: number;
  vehicle_capacity_utilization_percent: number;
  total_distance_km: number;
  estimated_time_hours: number;
  distance_saved_vs_unpooled_km: number;
  co2_saved_kg: number;
  spoilage_risk_percent: number;
  osrm_geometry?: any;
}

export interface MinistrySummary {
  ministry: string;
  department: string;
  problem_statement_id: string;
  macro_metrics: {
    total_farmer_earnings_uplift_inr: number;
    total_consumer_savings_inr: number;
    total_produce_traded_tonnes: number;
    active_fpos_onboarded: number;
    avg_farmer_earnings_uplift_percent: number;
    avg_consumer_cost_reduction_percent: number;
    avg_middleman_margin_eliminated_percent: number;
    co2_emissions_reduced_kg: number;
    supply_demand_stability_index: number;
  };
  regional_breakdown: Array<{
    region: string;
    primary_crop: string;
    active_routes: number;
    price_variance_reduction: string;
  }>;
}
