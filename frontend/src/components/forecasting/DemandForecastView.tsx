import React, { useEffect, useState } from 'react';
import { DemandForecast } from '../../types';
import { fetchDemandForecast } from '../../services/api';
import { TrendingUp, AlertTriangle, CloudSun, Calendar, Info, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from 'recharts';

export const DemandForecastView: React.FC = () => {
  const [commodity, setCommodity] = useState('Tomato');
  const [region, setRegion] = useState('Delhi-NCR');
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = () => {
    setLoading(true);
    fetchDemandForecast(commodity, region).then(res => {
      setForecast(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadForecast();
  }, [commodity, region]);

  if (loading || !forecast) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Commodity Price & Demand Analytics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Commodity Demand & Price Forecast</h1>
          <p className="text-xs text-slate-300">
            Predictive modeling combining historical Mandi arrival volumes, price volatility, and OpenMeteo weather features.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="bg-slate-900 text-emerald-400 font-bold text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="Tomato">🍅 Tomato (Hybrid Red)</option>
            <option value="Onion">🧅 Onion (Nashik Red)</option>
            <option value="Potato">🥔 Potato (Desi White)</option>
            <option value="Wheat">🌾 Wheat (Kalyan Sona)</option>
            <option value="Rice">🌾 Basmati Rice</option>
          </select>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-slate-900 text-cyan-400 font-bold text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="Delhi-NCR">📍 Delhi-NCR Hub</option>
            <option value="Mumbai">📍 Mumbai Corridor</option>
            <option value="Bengaluru">📍 Bengaluru Region</option>
            <option value="Punjab">📍 Punjab Mandi Circuit</option>
          </select>

          <button
            onClick={loadForecast}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Refresh Forecast Model"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Current Modal Mandi Price</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            ₹{forecast.current_modal_price} <span className="text-xs text-slate-400 font-normal">/ kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Source: Data.gov.in Agmarknet</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Price Volatility Index</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {forecast.price_volatility_percent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Perishable crop risk rating</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Model Horizon</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            14-Day Forward
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Generated: {forecast.generated_at}</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">14-Day Price & Demand Forecast Curve</h2>
              <p className="text-xs text-slate-400">Predicted Modal Price (Green) with 95% Confidence Band vs Projected Demand Volume (Cyan)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-300">Price (₹/kg)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span><span className="text-slate-300">Demand (Tonnes)</span></span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.demand_forecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="forecast_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="price" stroke="#22c55e" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <YAxis yAxisId="demand" orientation="right" stroke="#06b6d4" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any, name: any) => [
                    name === 'predicted_modal_price' ? `₹${val}/kg` : `${val} Tonnes`,
                    name === 'predicted_modal_price' ? 'Predicted Price' : 'Projected Demand'
                  ]}
                />
                <Area yAxisId="price" type="monotone" dataKey="predicted_modal_price" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#priceGrad)" />
                <Area yAxisId="demand" type="monotone" dataKey="predicted_demand_tonnes" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#demandGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explanatory Key Drivers Panel */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <span>Key Predictive Drivers</span>
          </h2>
          <p className="text-xs text-slate-400">Algorithmic factors shaping this forecast</p>

          <div className="space-y-3">
            {forecast.key_drivers.map((driver, idx) => (
              <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold font-mono">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Driver #{idx + 1}</span>
                </div>
                <p className="leading-relaxed">{driver}</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200 flex items-start space-x-2">
            <CloudSun className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-cyan-300">OpenMeteo Live Integration</strong>
              Temperature & rainfall telemetry directly adjusts perishable crop shelf-life degradation rates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
