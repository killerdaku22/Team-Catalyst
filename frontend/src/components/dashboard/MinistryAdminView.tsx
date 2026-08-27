import React, { useEffect, useState } from 'react';
import { MinistrySummary, PolicyScenarioResult, MarketEvent } from '../../types';
import { fetchMinistrySummary, simulatePolicyScenario, fetchActiveMarketEvents } from '../../services/api';
import {
  TrendingUp,
  Users,
  ShieldCheck,
  DollarSign,
  Scale,
  Leaf,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DataProvenance } from '../ui/DataProvenance';

export const MinistryAdminView: React.FC = () => {
  const [data, setData] = useState<MinistrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Policy Simulator State
  const [scenarioTitle, setScenarioTitle] = useState('Monsoon Rail Freight Subsidy (Operation Greens)');
  const [policyType, setPolicyType] = useState('FREIGHT_SUBSIDY');
  const [targetCommodity, setTargetCommodity] = useState('Tomato');
  const [targetRegion, setTargetRegion] = useState('Kolar to Delhi Corridor');
  const [magnitudePct, setMagnitudePct] = useState(30);
  const [volumeTonnes, setVolumeTonnes] = useState(8000);
  const [farmerPrice, setFarmerPrice] = useState(24.0);
  const [retailPrice, setRetailPrice] = useState(42.0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicyScenarioResult | null>(null);

  // Market Intelligence Shocks Feed
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);

  useEffect(() => {
    Promise.all([
      fetchMinistrySummary(),
      fetchActiveMarketEvents()
    ]).then(([minData, events]) => {
      setData(minData);
      setMarketEvents(events);
      setLoading(false);
      // Run initial baseline policy simulation
      handleSimulatePolicy();
    });
  }, []);

  const handleSimulatePolicy = async () => {
    setIsSimulating(true);
    try {
      const res = await simulatePolicyScenario({
        scenario_title: scenarioTitle,
        policy_type: policyType,
        target_commodity: targetCommodity,
        target_region: targetRegion,
        intervention_magnitude_pct: magnitudePct,
        estimated_regional_volume_tonnes: volumeTonnes,
        baseline_farmer_price_per_kg: farmerPrice,
        baseline_retail_price_per_kg: retailPrice
      });
      setPolicyResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  const applyPreset = (preset: {
    title: string;
    type: string;
    commodity: string;
    region: string;
    mag: number;
    vol: number;
    fp: number;
    rp: number;
  }) => {
    setScenarioTitle(preset.title);
    setPolicyType(preset.type);
    setTargetCommodity(preset.commodity);
    setTargetRegion(preset.region);
    setMagnitudePct(preset.mag);
    setVolumeTonnes(preset.vol);
    setFarmerPrice(preset.fp);
    setRetailPrice(preset.rp);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { macro_metrics, regional_breakdown } = data;

  const priceMarginComparisonData = [
    { crop: 'Wheat', farmer_direct: 2450, middleman_payout: 2100, retail_price: 3400, logistics_cost: 280 },
    { crop: 'Red Onion', farmer_direct: 2300, middleman_payout: 1750, retail_price: 3800, logistics_cost: 320 },
    { crop: 'Tomato', farmer_direct: 3200, middleman_payout: 2400, retail_price: 5200, logistics_cost: 410 },
    { crop: 'Potato', farmer_direct: 1680, middleman_payout: 1320, retail_price: 2600, logistics_cost: 210 },
    { crop: 'Basmati Rice', farmer_direct: 4250, middleman_payout: 3800, retail_price: 5800, logistics_cost: 390 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#222C27] text-[#48BB78] border border-[#2B3731] text-xs px-3 py-1 rounded-full font-mono font-semibold">
                DoCA Market Oversight & Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
              Department of Consumer Affairs (DoCA) — Market Intelligence & Oversight
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Read-only oversight of agricultural disintermediation, price variance reduction, direct farmer payout uplift, and urban consumer price stabilization.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <DataProvenance source="DoCA National Price Monitoring Cell" status="LIVE" />
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400">Supply Stability Index</div>
              <div className="text-xl font-black text-emerald-400 flex items-center justify-end space-x-1">
                <span>{macro_metrics.supply_demand_stability_index}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer Earnings Uplift</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹{(macro_metrics.total_farmer_earnings_uplift_inr).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{macro_metrics.avg_farmer_earnings_uplift_percent}% net income vs middleman</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consumer Cost Savings</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹{(macro_metrics.total_consumer_savings_inr).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-cyan-400 font-medium">
              <ArrowDownRight className="w-4 h-4" />
              <span>-{macro_metrics.avg_consumer_cost_reduction_percent}% lower retail price</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Middleman Margin Cut</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {macro_metrics.avg_middleman_margin_eliminated_percent}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Redirected to Farmer & Consumer value
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carbon Footprint Saved</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {macro_metrics.co2_emissions_reduced_kg.toLocaleString()} kg
            </div>
            <div className="text-xs text-teal-400 mt-1 font-medium">
              Via pooled multi-stop VRP routing
            </div>
          </div>
        </div>
      </div>

      {/* Disintermediation Chart & Regional Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Commodity Price Structure & Middleman Margin Breakdown</h2>
              <p className="text-xs text-slate-400">Comparing Farmer Direct Payout (Green) vs Traditional Broker Baseline (Amber) vs Urban Retail Price (Cyan)</p>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
              Unit: ₹ / Quintal
            </div>
          </div>

          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceMarginComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="crop" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`₹${value}/qtl`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="farmer_direct" name="Farmer Direct Payout" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="middleman_payout" name="Middleman Broker Payout" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retail_price" name="Urban Retail Price" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Trade Corridor Overview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">Active Agricultural Trade Corridors</h2>
          <p className="text-xs text-slate-400 mb-4">Direct FPO-to-City logistics routes monitored by DoCA</p>

          <div className="space-y-3">
            {regional_breakdown.map((item, idx) => (
              <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{item.region}</span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono font-medium">
                    {item.price_variance_reduction} volatility ↓
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>Crop: <strong className="text-slate-200">{item.primary_crop}</strong></span>
                  <span>Routes: <strong className="text-slate-200">{item.active_routes} pooled trucks</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Verified Provenance & Metrology</strong>
              Every direct listing is batch-certified with legal metrology packaging standards.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DoCA POLICY WHAT-IF SCENARIO SIMULATOR */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                DoCA Macroeconomic Policy Simulator
              </span>
              <DataProvenance source="Microeconomic Equilibrium Policy Model" status="SIMULATION" />
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              What-If Intervention & Benefit-to-Cost Welfare Modeler
            </h2>
            <p className="text-xs text-slate-400">
              Evaluate fiscal budget outlays, farmer earnings uplift, and consumer price relief before enacting national price stabilization orders.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                applyPreset({
                  title: "Monsoon Rail Freight Subsidy (Operation Greens)",
                  type: "FREIGHT_SUBSIDY",
                  commodity: "Tomato",
                  region: "Kolar to Delhi Corridor",
                  mag: 30,
                  vol: 8000,
                  fp: 24.0,
                  rp: 42.0
                });
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-medium"
            >
              Preset: Freight Subsidy
            </button>
            <button
              onClick={() => {
                applyPreset({
                  title: "Strategic Buffer Stock Release (Onion Price Stabilization)",
                  type: "BUFFER_STOCK_RELEASE",
                  commodity: "Onion",
                  region: "National Capital Region (NCR)",
                  mag: 25,
                  vol: 12000,
                  fp: 20.0,
                  rp: 38.0
                });
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-medium"
            >
              Preset: Buffer Release
            </button>
            <button
              onClick={() => {
                applyPreset({
                  title: "Cold Storage Power Assistance during Summer Glut",
                  type: "STORAGE_SUBSIDY",
                  commodity: "Potato",
                  region: "Agra-Aligarh Belt",
                  mag: 50,
                  vol: 15000,
                  fp: 12.0,
                  rp: 22.0
                });
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-medium"
            >
              Preset: Storage Subsidy
            </button>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Policy Intervention Type</label>
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2"
            >
              <option value="FREIGHT_SUBSIDY">FREIGHT_SUBSIDY</option>
              <option value="BUFFER_STOCK_RELEASE">BUFFER_STOCK_RELEASE</option>
              <option value="STORAGE_SUBSIDY">STORAGE_SUBSIDY</option>
              <option value="PRICE_CAP_STABILIZATION">PRICE_CAP_STABILIZATION</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Target Commodity</label>
            <input
              type="text"
              value={targetCommodity}
              onChange={(e) => setTargetCommodity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Intervention Magnitude (%)</label>
            <input
              type="number"
              value={magnitudePct}
              onChange={(e) => setMagnitudePct(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Volume (Tonnes)</label>
            <input
              type="number"
              value={volumeTonnes}
              onChange={(e) => setVolumeTonnes(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSimulatePolicy}
            disabled={isSimulating}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>{isSimulating ? 'Running Microeconomic Simulation...' : 'Simulate Policy Impact'}</span>
          </button>
        </div>

        {/* Policy Simulation Results */}
        {policyResult && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Farmer Income Uplift</span>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  ₹{policyResult.farmer_earnings_uplift_total_inr.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Farmgate Price: ₹{policyResult.projected_new_farmer_price_per_kg}/kg
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Consumer Welfare Savings</span>
                <div className="text-xl font-extrabold text-cyan-400 mt-1">
                  ₹{policyResult.consumer_savings_total_inr.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Retail Price: ₹{policyResult.projected_new_retail_price_per_kg}/kg
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Fiscal Outlay</span>
                <div className="text-xl font-extrabold text-rose-400 mt-1">
                  ₹{policyResult.total_government_fiscal_outlay_inr.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Government Budget Requirement
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Benefit-Cost Ratio (BCR)</span>
                <div className="text-xl font-extrabold text-purple-400 mt-1">
                  {policyResult.benefit_cost_ratio}×
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  Risk: {policyResult.market_distortion_risk}
                </div>
              </div>
            </div>

            {/* Tradeoff & Recommendation Card */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs space-y-2">
              <div className="font-bold text-blue-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Policy Evaluation & Economic Tradeoff Analysis:</span>
              </div>
              <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
                {policyResult.tradeoff_analysis.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
              <div className="pt-2 text-emerald-300 font-semibold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{policyResult.implementation_recommendation}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: ACTIVE MARKET SHOCKS & DISRUPTION INTELLIGENCE */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                Real-Time Intelligence Network
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Active Regional Shocks & Supply Disruption Alerts
            </h2>
            <p className="text-xs text-slate-400">
              Verified telemetry from Indian Meteorological Department (IMD), State APMCs, and Railways.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {marketEvents.length} Active Events Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {marketEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border transition-all ${
                evt.severity === 'CRITICAL' || evt.severity === 'HIGH'
                  ? 'border-amber-500/40 bg-amber-950/15'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                  {evt.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  evt.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {evt.severity}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm leading-snug">{evt.title}</h4>
              <p className="text-slate-400 text-[11px] mt-1">Region: {evt.affected_region}</p>
              
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Price Multiplier:</span>
                <strong className="text-emerald-400">×{evt.price_shock_multiplier}</strong>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Source: {evt.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
