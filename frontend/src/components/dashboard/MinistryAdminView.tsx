import React, { useEffect, useState } from 'react';
import { MinistrySummary } from '../../types';
import { fetchMinistrySummary } from '../../services/api';
import { TrendingUp, Users, ShieldCheck, DollarSign, Scale, Leaf, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

export const MinistryAdminView: React.FC = () => {
  const [data, setData] = useState<MinistrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistrySummary().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { macro_metrics, regional_breakdown } = data;

  // Comparison Price Structure Chart Data (Rs per Quintal)
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
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                SIH26033 National Prototype
              </span>
              <span className="text-slate-400 text-xs font-mono">• Official DoCA Monitoring Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
              Department of Consumer Affairs (DoCA) National Executive Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Real-time monitoring of agricultural disintermediation, price variance reduction, direct farmer payout uplift, and urban consumer price stabilization.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-right font-mono">
            <div className="text-xs text-slate-400">Supply Stability Index</div>
            <div className="text-2xl font-black text-emerald-400 flex items-center justify-end space-x-1">
              <span>{macro_metrics.supply_demand_stability_index}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="text-[11px] text-emerald-500 font-sans font-semibold">Optimal Distribution</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Farmer Earnings Uplift */}
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

        {/* Card 2: Consumer Savings */}
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

        {/* Card 3: Middleman Margin Eliminated */}
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

        {/* Card 4: Environmental & Efficiency */}
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

      {/* Disintermediation Chart Section */}
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
              <strong className="text-white block font-semibold">Verified Provenance & Quality Standard</strong>
              Every direct listing is batch-certified with legal metrology compliant packaging and digital quality seals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
