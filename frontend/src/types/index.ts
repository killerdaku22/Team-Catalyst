export type UserRole = 'FPO' | 'FPO_MANAGER' | 'FARMER' | 'BUYER' | 'LOGISTICS' | 'TRANSPORTER' | 'MINISTRY_ADMIN' | 'GOVT_AUDITOR' | 'ADMIN';

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

export interface OptionPayoff {
  action: 'SELL_NOW' | 'STORE' | 'MOVE' | 'SPLIT';
  expected_net_revenue: number;
  expected_price_per_kg: number;
  revenue_uplift_vs_sell_now: number;
  revenue_uplift_pct: number;
  costs_breakdown: {
    storage_cost?: number;
    transport_cost?: number;
    spoilage_loss?: number;
    handling_fee?: number;
  };
  risk_level: string;
  feasibility: string;
  details: Record<string, any>;
}

export interface BatchDecisionResult {
  commodity: string;
  quantity_kg: number;
  optimal_action: 'SELL_NOW' | 'STORE' | 'MOVE' | 'SPLIT';
  optimal_net_revenue: number;
  net_uplift_vs_local_sell_now: number;
  net_uplift_pct: number;
  recommendation_summary: string;
  key_decision_factors: string[];
  options_comparison: OptionPayoff[];
  split_allocation?: {
    sell_now_kg: number;
    optimized_rem_kg: number;
    target: string;
  } | null;
}

export interface MarketOpportunityItem {
  rank: number;
  destination_name: string;
  destination_type: string;
  state: string;
  distance_km: number;
  estimated_transit_hours: number;
  gross_market_price_per_kg: number;
  freight_cost_per_kg: number;
  transit_spoilage_loss_per_kg: number;
  mandi_handling_fee_per_kg: number;
  net_realization_per_kg: number;
  total_net_payout: number;
  net_uplift_vs_local_per_kg: number;
  net_uplift_amount_total: number;
  net_uplift_percent: number;
  recommendation_tier: 'TOP_OPPORTUNITY' | 'ATTRACTIVE' | 'MARGINAL' | 'UNFAVORABLE';
}

export interface OpportunityRankingResult {
  commodity: string;
  quantity_kg: number;
  origin_location: string;
  local_baseline_price_per_kg: number;
  local_net_revenue: number;
  top_recommended_destination: string;
  top_destination_type: string;
  top_net_realization_per_kg: number;
  max_net_uplift_total: number;
  max_net_uplift_pct: number;
  ranked_opportunities: MarketOpportunityItem[];
  insights: string[];
}

export interface MarketEvent {
  id: string;
  title: string;
  category: string;
  affected_region: string;
  affected_commodities: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supply_impact_pct: number;
  price_shock_multiplier: number;
  source: string;
  confidence_score: number;
  created_at: string;
}

export interface PolicyScenarioResult {
  scenario_title: string;
  policy_type: string;
  target_commodity: string;
  target_region: string;
  farmer_earnings_uplift_total_inr: number;
  consumer_savings_total_inr: number;
  total_government_fiscal_outlay_inr: number;
  benefit_cost_ratio: number;
  projected_new_farmer_price_per_kg: number;
  projected_new_retail_price_per_kg: number;
  market_distortion_risk: 'LOW' | 'MODERATE' | 'HIGH';
  tradeoff_analysis: string[];
  implementation_recommendation: string;
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
