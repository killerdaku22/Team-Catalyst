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
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, var(--ad-surface-0) 0%, var(--ad-surface-1) 100%)',
          border: '1px solid var(--ad-border-accent)',
          borderLeft: '3px solid var(--ad-accent)',
          boxShadow: 'var(--ad-shadow-lg), var(--ad-shadow-glow-accent)',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase"
                style={{
                  background: 'var(--ad-accent-light)',
                  color: 'var(--ad-accent-bright)',
                  border: '1px solid var(--ad-border-accent)',
                  fontFamily: 'var(--ad-font-display)'
                }}
              >
                DoCA Market Oversight & Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              Department of Consumer Affairs (DoCA) — Market Intelligence & Oversight
            </h1>
            <p className="text-sm mt-1 max-w-3xl leading-relaxed" style={{ color: 'var(--ad-text-tertiary)' }}>
              Read-only oversight of agricultural disintermediation, price variance reduction, direct farmer payout uplift, and urban consumer price stabilization.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <DataProvenance source="DoCA National Price Monitoring Cell" status="LIVE" />
            <div
              className="p-3.5 rounded-xl text-right font-mono"
              style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>Supply Stability Index</div>
              <div className="text-xl font-extrabold flex items-center justify-end space-x-1" style={{ color: 'var(--ad-brand-bright)', fontFamily: 'var(--ad-font-display)' }}>
                <span>{macro_metrics.supply_demand_stability_index}</span>
                <span className="text-xs font-normal" style={{ color: 'var(--ad-text-muted)' }}>/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid — Color-coded left accents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          className="p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
            borderLeft: '3px solid var(--ad-brand-bright)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Farmer Earnings Uplift</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ad-brand-light)', color: 'var(--ad-brand-bright)' }}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              ₹{(macro_metrics.total_farmer_earnings_uplift_inr).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs font-semibold" style={{ color: 'var(--ad-brand-bright)' }}>
              <ArrowUpRight className="w-4 h-4" />
              <span>+{macro_metrics.avg_farmer_earnings_uplift_percent}% net income vs middleman</span>
            </div>
          </div>
        </div>

        <div
          className="p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
            borderLeft: '3px solid var(--ad-cool-bright)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Consumer Cost Savings</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ad-cool-light)', color: 'var(--ad-cool-bright)' }}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              ₹{(macro_metrics.total_consumer_savings_inr).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs font-semibold" style={{ color: 'var(--ad-cool-bright)' }}>
              <ArrowDownRight className="w-4 h-4" />
              <span>-{macro_metrics.avg_consumer_cost_reduction_percent}% lower retail price</span>
            </div>
          </div>
        </div>

        <div
          className="p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
            borderLeft: '3px solid var(--ad-accent)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Middleman Margin Cut</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ad-accent-light)', color: 'var(--ad-accent-bright)' }}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              {macro_metrics.avg_middleman_margin_eliminated_percent}%
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--ad-text-muted)' }}>
              Redirected to Farmer & Consumer value
            </div>
          </div>
        </div>

        <div
          className="p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-sm"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
            borderLeft: '3px solid var(--ad-brand)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Carbon Footprint Saved</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ad-brand-light)', color: 'var(--ad-brand-bright)' }}
            >
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              {macro_metrics.co2_emissions_reduced_kg.toLocaleString()} kg
            </div>
            <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--ad-brand-bright)' }}>
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
        <div
          className="p-6 rounded-2xl shadow-sm"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
          }}
        >
          <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
            Active Agricultural Trade Corridors
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--ad-text-tertiary)' }}>
            Direct FPO-to-City logistics routes monitored by DoCA
          </p>

          <div className="space-y-3">
            {regional_breakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl transition-all"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: 'var(--ad-text-primary)' }}>{item.region}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-mono font-medium"
                    style={{
                      background: 'var(--ad-accent-light)',
                      color: 'var(--ad-accent-bright)',
                      border: '1px solid var(--ad-border-accent)',
                    }}
                  >
                    {item.price_variance_reduction} volatility ↓
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--ad-text-tertiary)' }}>
                  <span>Crop: <strong style={{ color: 'var(--ad-text-secondary)' }}>{item.primary_crop}</strong></span>
                  <span>Routes: <strong style={{ color: 'var(--ad-text-secondary)' }}>{item.active_routes} pooled trucks</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-5 p-3 rounded-xl flex items-start space-x-3 text-xs"
            style={{
              background: 'var(--ad-surface-1)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-secondary)',
            }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ad-brand-bright)' }} />
            <div>
              <strong className="block font-semibold" style={{ color: 'var(--ad-text-primary)' }}>Verified Provenance & Metrology</strong>
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
              className="px-3 py-1.5 rounded-lg transition-all font-medium text-xs"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-secondary)',
              }}
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
              className="px-3 py-1.5 rounded-lg transition-all font-medium text-xs"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-secondary)',
              }}
            >
              Preset: Storage Subsidy
            </button>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block mb-1 font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Policy Intervention Type</label>
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              className="w-full rounded-xl px-3 py-2 font-medium focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-primary)',
              }}
            >
              <option value="FREIGHT_SUBSIDY">FREIGHT_SUBSIDY</option>
              <option value="BUFFER_STOCK_RELEASE">BUFFER_STOCK_RELEASE</option>
              <option value="STORAGE_SUBSIDY">STORAGE_SUBSIDY</option>
              <option value="PRICE_CAP_STABILIZATION">PRICE_CAP_STABILIZATION</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Target Commodity</label>
            <input
              type="text"
              value={targetCommodity}
              onChange={(e) => setTargetCommodity(e.target.value)}
              className="w-full rounded-xl px-3 py-2 font-medium focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Intervention Magnitude (%)</label>
            <input
              type="number"
              value={magnitudePct}
              onChange={(e) => setMagnitudePct(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2 font-mono focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Volume (Tonnes)</label>
            <input
              type="number"
              value={volumeTonnes}
              onChange={(e) => setVolumeTonnes(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2 font-mono focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSimulatePolicy}
            disabled={isSimulating}
            className="font-bold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer"
            style={{
              background: 'var(--ad-brand-bright)',
              color: '#FFFFFF',
              boxShadow: 'var(--ad-shadow-sm)',
            }}
          >
            <Sliders className="w-4 h-4" />
            <span>{isSimulating ? 'Running Microeconomic Simulation...' : 'Simulate Policy Impact'}</span>
          </button>
        </div>

        {/* Policy Simulation Results */}
        {policyResult && (
          <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--ad-border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div
                className="p-4 rounded-xl shadow-sm"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--ad-text-muted)' }}>Farmer Income Uplift</span>
                <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--ad-brand-bright)' }}>
                  ₹{policyResult.farmer_earnings_uplift_total_inr.toLocaleString()}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--ad-text-tertiary)' }}>
                  Farmgate Price: ₹{policyResult.projected_new_farmer_price_per_kg}/kg
                </div>
              </div>

              <div
                className="p-4 rounded-xl shadow-sm"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--ad-text-muted)' }}>Consumer Welfare Savings</span>
                <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--ad-cool-bright)' }}>
                  ₹{policyResult.consumer_savings_total_inr.toLocaleString()}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--ad-text-tertiary)' }}>
                  Retail Price: ₹{policyResult.projected_new_retail_price_per_kg}/kg
                </div>
              </div>

              <div
                className="p-4 rounded-xl shadow-sm"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--ad-text-muted)' }}>Fiscal Outlay</span>
                <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--ad-danger-bright)' }}>
                  ₹{policyResult.total_government_fiscal_outlay_inr.toLocaleString()}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--ad-text-tertiary)' }}>
                  Government Budget Requirement
                </div>
              </div>

              <div
                className="p-4 rounded-xl shadow-sm"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--ad-text-muted)' }}>Benefit-Cost Ratio (BCR)</span>
                <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--ad-accent-bright)' }}>
                  {policyResult.benefit_cost_ratio}×
                </div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--ad-brand-bright)' }}>
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
                Market Shock Simulation & Intelligence Network
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Active Regional Shocks & Supply Disruption Alerts
            </h2>
            <p className="text-xs text-slate-400">
              Scenario-based disruption modeling and risk impact analysis across regional APMC production belts.
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
