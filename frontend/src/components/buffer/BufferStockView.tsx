import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Truck,
  TrendingDown,
  Building2,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  Calculator,
  PlusCircle,
  X
} from 'lucide-react';
import { DataProvenance } from '../ui/DataProvenance';

interface BufferReserve {
  silo_id: string;
  managing_agency: string;
  commodity: string;
  location_hub: string;
  state: string;
  latitude: number;
  longitude: number;
  total_stored_tonnes: number;
  reserved_minimum_tonnes: number;
  available_for_release_tonnes: number;
  procurement_vintage: string;
  condition_grade: string;
}

interface ConvoyDispatch {
  dispatch_id: string;
  managing_agency: string;
  commodity: string;
  origin_silo: string;
  target_urban_cluster: string;
  dispatched_tonnes: number;
  subsidized_consumer_price_per_kg: number;
  market_price_before_release: number;
  projected_price_cooling_pct: number;
  convoy_status: string;
  timestamp: string;
}

export const BufferStockView: React.FC = () => {
  const [reserves, setReserves] = useState<BufferReserve[]>([]);
  const [dispatches, setDispatches] = useState<ConvoyDispatch[]>([]);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  
  // Intervention Form State
  const [commodity, setCommodity] = useState('Tomato');
  const [urbanCluster, setUrbanCluster] = useState('Delhi-NCR Retail Outlets & Mobile Kendras');
  const [currentMarketPrice, setCurrentMarketPrice] = useState(58.0);
  const [benchmarkPrice, setBenchmarkPrice] = useState(32.0);
  const [releaseQuantity, setReleaseQuantity] = useState(500.0);
  const [subsidizedPrice, setSubsidizedPrice] = useState(25.0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [interventionResult, setInterventionResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000/api/v1';

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/buffer/inventory`).then(r => r.json()),
      fetch(`${API_BASE}/buffer/active-dispatches`).then(r => r.json())
    ]).then(([resRes, dispRes]) => {
      setReserves(resRes);
      setDispatches(dispRes);
      setLoading(false);
    }).catch(err => {
      console.warn("Buffer stock fallback:", err);
      setLoading(false);
    });
  }, []);

  const handleTriggerIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const res = await fetch(`${API_BASE}/buffer/trigger-intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_commodity: commodity,
          target_urban_cluster: urbanCluster,
          current_market_price_per_kg: currentMarketPrice,
          historical_benchmark_price_per_kg: benchmarkPrice,
          release_quantity_tonnes: releaseQuantity,
          subsidized_retail_price_per_kg: subsidizedPrice
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInterventionResult(data);
        setDispatches([data.dispatched_convoy, ...dispatches]);
      } else {
        // Fallback simulation
        const pctDev = Math.round(((currentMarketPrice - benchmarkPrice) / benchmarkPrice) * 100);
        const cooling = Math.min(40, Math.round((releaseQuantity / 1000) * 8.5 + (pctDev * 0.4)));
        const subsidy = (currentMarketPrice - subsidizedPrice) * releaseQuantity * 1000;
        const newDispatch = {
          dispatch_id: `DISP-2026-${Math.floor(100 + Math.random() * 900)}`,
          managing_agency: "NCCF / NAFED",
          commodity,
          origin_silo: "Strategic Buffer Silo",
          target_urban_cluster: urbanCluster,
          dispatched_tonnes: releaseQuantity,
          subsidized_consumer_price_per_kg: subsidizedPrice,
          market_price_before_release: currentMarketPrice,
          projected_price_cooling_pct: cooling,
          convoy_status: "CONVOY_DISPATCHED",
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        setInterventionResult({
          intervention_id: `INT-MIS-${Math.floor(100 + Math.random() * 900)}`,
          is_triggered: true,
          price_deviation_percent: pctDev,
          intervention_tier: pctDev >= 25 ? "MANDATORY_BUFFER_RELEASE" : "OPTIONAL_MONITORING",
          dispatched_convoy: newDispatch,
          fiscal_subsidy_burden_inr: subsidy,
          consumer_welfare_benefit_inr: subsidy * 1.85,
          benefit_cost_ratio: 1.85
        });
        setDispatches([newDispatch, ...dispatches]);
      }
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-2xl items-center shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--ad-surface-0) 0%, var(--ad-surface-1) 100%)',
          border: '1px solid var(--ad-border-accent)',
          borderLeft: '3px solid var(--ad-accent)',
          boxShadow: 'var(--ad-shadow-lg), var(--ad-shadow-glow-accent)',
        }}
      >
        <div className="lg:col-span-8 space-y-4">
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
              DoCA National Food Security & Market Intervention Scheme (MIS)
            </span>
            <DataProvenance source="DoCA Strategic Buffer Reference (NAFED/NCCF Guidelines)" status="HISTORICAL" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
            Strategic Buffer Stock & Price Stabilization
          </h1>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--ad-text-tertiary)' }}>
            Monitoring of NAFED and NCCF strategic buffer stock with automated convoy dispatch simulation to evaluate market cooling interventions.
          </p>

          <div>
            <button
              onClick={() => {
                setShowInterventionModal(true);
                setInterventionResult(null);
              }}
              className="px-5 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                color: '#0B0F0D',
                boxShadow: '0 2px 10px rgba(199, 163, 86, 0.25)',
                fontFamily: 'var(--ad-font-display)'
              }}
            >
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              <span>Trigger MIS Market Intervention</span>
            </button>
          </div>
        </div>

        {/* Contextual Grain Silo Image */}
        <div
          className="lg:col-span-4 relative rounded-xl overflow-hidden aspect-[16/10] shadow-md group"
          style={{ background: 'var(--ad-surface-muted)', border: '1px solid var(--ad-border)' }}
        >
          <img
            src="/assets/agridirect-grain-buffer-silo.jpg"
            alt="National Strategic Buffer Silo"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--ad-surface-0) 0%, transparent 40%)' }}
          />
          <div
            className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-lg text-[10px] flex justify-between items-center"
            style={{
              background: 'rgba(11, 15, 13, 0.88)',
              border: '1px solid var(--ad-border)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span className="font-bold text-white">NAFED Silo Complex</span>
            <span className="font-bold" style={{ color: 'var(--ad-accent-bright)' }}>180,000 MT Reserve</span>
          </div>
        </div>
      </div>

      {/* Strategic Silos Inventory Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center space-x-2" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
          <Building2 className="w-4 h-4" style={{ color: 'var(--ad-accent)' }} />
          <span>National Strategic Reserve Silos (180,000+ Tonnes Under Management)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reserves.map(silo => {
            const availPct = Math.round((silo.available_for_release_tonnes / silo.total_stored_tonnes) * 100);
            return (
              <div
                key={silo.silo_id}
                className="p-5 rounded-2xl space-y-3 relative overflow-hidden"
                style={{
                  background: 'var(--ad-surface-0)',
                  border: '1px solid var(--ad-border)',
                  borderLeft: '3px solid var(--ad-accent)',
                  boxShadow: 'var(--ad-shadow-sm)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        background: 'var(--ad-accent-light)',
                        color: 'var(--ad-accent-bright)',
                        border: '1px solid var(--ad-border-accent)',
                        fontFamily: 'var(--ad-font-display)'
                      }}
                    >
                      {silo.managing_agency}
                    </span>
                    <h3 className="font-bold text-base mt-1.5" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                      {silo.commodity} Silo
                    </h3>
                    <p className="text-xs flex items-center space-x-1 mt-0.5" style={{ color: 'var(--ad-text-muted)' }}>
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--ad-cool)' }} />
                      <span>{silo.location_hub}, {silo.state}</span>
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px]"
                    style={{ background: 'var(--ad-surface-1)', color: 'var(--ad-text-tertiary)', border: '1px solid var(--ad-border-subtle)' }}
                  >
                    {silo.condition_grade}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ad-text-muted)' }}>Available for Release:</span>
                    <strong className="font-semibold" style={{ color: 'var(--ad-text-primary)' }}>
                      {silo.available_for_release_tonnes.toLocaleString()} / {silo.total_stored_tonnes.toLocaleString()} T
                    </strong>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--ad-surface-muted)', border: '1px solid var(--ad-border-subtle)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${availPct}%`,
                        background: 'linear-gradient(90deg, var(--ad-brand), var(--ad-accent))'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] pt-0.5" style={{ color: 'var(--ad-text-muted)' }}>
                    <span>Strategic Floor: {silo.reserved_minimum_tonnes.toLocaleString()} T</span>
                    <span style={{ color: 'var(--ad-accent-bright)', fontWeight: 600 }}>{availPct}% Liquid</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] flex justify-between" style={{ borderTop: '1px solid var(--ad-border-subtle)', color: 'var(--ad-text-muted)' }}>
                  <span>Vintage: <strong style={{ color: 'var(--ad-text-secondary)' }}>{silo.procurement_vintage}</strong></span>
                  <span className="font-semibold" style={{ color: 'var(--ad-brand-bright)' }}>Ready to Dispatch</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Subsidized Intervention Convoys Feed */}
      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center space-x-2" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
          <Truck className="w-4 h-4" style={{ color: 'var(--ad-cool-bright)' }} />
          <span>Active Subsidized Food Security Intervention Convoys</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dispatches.map(disp => (
            <div
              key={disp.dispatch_id}
              className="p-4 rounded-2xl space-y-3"
              style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--ad-cool-light)', color: 'var(--ad-cool-bright)', border: '1px solid rgba(88, 134, 160, 0.2)' }}
                  >
                    🚚
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                      {disp.commodity} Convoy ({disp.dispatched_tonnes} Tonnes)
                    </h4>
                    <span className="text-[11px]" style={{ color: 'var(--ad-text-muted)' }}>
                      {disp.managing_agency} Dispatch · {disp.dispatch_id}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'var(--ad-brand-light)',
                    color: 'var(--ad-brand-bright)',
                    border: '1px solid rgba(52, 199, 114, 0.2)',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  {disp.convoy_status}
                </span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Market:</span>
                  <strong className="text-white">{disp.target_urban_cluster}</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Subsidized Retail Price:</span>
                  <strong className="text-emerald-400">₹{disp.subsidized_consumer_price_per_kg}/kg (vs ₹{disp.market_price_before_release}/kg Market)</strong>
                </div>
                <div className="flex justify-between font-mono text-cyan-400 font-semibold pt-1 border-t border-slate-800">
                  <span>Projected Retail Price Cooling:</span>
                  <span>-{disp.projected_price_cooling_pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intervention Trigger Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 max-w-lg w-full space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Trigger Market Intervention Scheme (MIS)</h3>
                <DataProvenance source="Price-Elasticity Market Injection Simulator" status="SIMULATION" />
              </div>
              <button onClick={() => setShowInterventionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerIntervention} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Commodity:</label>
                  <input
                    type="text"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Release Volume (Tonnes):</label>
                  <input
                    type="number"
                    value={releaseQuantity}
                    onChange={(e) => setReleaseQuantity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Deficit Urban Market Cluster:</label>
                <input
                  type="text"
                  value={urbanCluster}
                  onChange={(e) => setUrbanCluster(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Current Retail (₹/kg):</label>
                  <input
                    type="number"
                    value={currentMarketPrice}
                    onChange={(e) => setCurrentMarketPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-rose-400 font-bold rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Historical Baseline (₹/kg):</label>
                  <input
                    type="number"
                    value={benchmarkPrice}
                    onChange={(e) => setBenchmarkPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subsidized Price (₹/kg):</label>
                  <input
                    type="number"
                    value={subsidizedPrice}
                    onChange={(e) => setSubsidizedPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTriggering}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-xs"
              >
                {isTriggering ? 'Simulating Dispatch...' : 'Dispatch Strategic Buffer Convoy'}
              </button>

              {interventionResult && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-xs animate-fadeIn">
                  <div className="flex justify-between items-center font-bold text-emerald-300">
                    <span>✓ Intervention Dispatched: {interventionResult.intervention_id}</span>
                    <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      BCR {interventionResult.benefit_cost_ratio}x
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div>Projected Cooling: <strong className="text-cyan-400">-{interventionResult.dispatched_convoy.projected_price_cooling_pct}%</strong></div>
                    <div>Consumer Benefit: <strong className="text-emerald-400">₹{interventionResult.consumer_welfare_benefit_inr.toLocaleString()}</strong></div>
                    <div className="col-span-2 text-slate-400">Fiscal Subsidy Outlay: ₹{interventionResult.fiscal_subsidy_burden_inr.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
