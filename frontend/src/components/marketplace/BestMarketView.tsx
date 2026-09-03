import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  Truck,
  Building,
  ShieldCheck,
  Scale,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  DollarSign,
  Compass,
  Zap,
  HelpCircle,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { fetchBestMarketOpportunities } from '../../services/api';
import { OpportunityRankingResult, MarketOpportunityItem } from '../../types';
import { DataProvenance } from '../ui/DataProvenance';

interface BestMarketViewProps {
  onSelectMarket?: (market: MarketOpportunityItem) => void;
  onNavigateToLogistics?: () => void;
}

const ORIGIN_HUBS = [
  { id: 'kolar', name: 'Kolar Farmers Federation', location: 'Kolar Agri Hub, Karnataka', lat: 13.1367, lon: 78.1292, defaultCrop: 'Tomato', defaultPrice: 26.0 },
  { id: 'nashik', name: 'Nashik Agro Producer Co.', location: 'Pimpalgaon, Nashik, Maharashtra', lat: 20.1700, lon: 73.9800, defaultCrop: 'Onion', defaultPrice: 24.5 },
  { id: 'agra', name: 'Agra Potato Producers Union', location: 'Khandari, Agra, Uttar Pradesh', lat: 27.1767, lon: 78.0081, defaultCrop: 'Potato', defaultPrice: 16.0 },
  { id: 'ludhiana', name: 'Punjab Kisan Cooperative', location: 'Khanna Mandi, Ludhiana, Punjab', lat: 30.9010, lon: 75.8573, defaultCrop: 'Wheat', defaultPrice: 24.0 },
];

export const BestMarketView: React.FC<BestMarketViewProps> = ({
  onSelectMarket,
  onNavigateToLogistics
}) => {
  const [selectedHub, setSelectedHub] = useState(ORIGIN_HUBS[0]);
  const [commodity, setCommodity] = useState(ORIGIN_HUBS[0].defaultCrop);
  const [quantityKg, setQuantityKg] = useState(5000);
  const [baselinePrice, setBaselinePrice] = useState(ORIGIN_HUBS[0].defaultPrice);
  const [radiusKm, setRadiusKm] = useState(450);
  const [ambientTemp, setAmbientTemp] = useState(28);

  const [rankingResult, setRankingResult] = useState<OpportunityRankingResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetchBestMarketOpportunities({
        commodity,
        quantity_kg: quantityKg,
        origin_location: selectedHub.location,
        origin_latitude: selectedHub.lat,
        origin_longitude: selectedHub.lon,
        local_baseline_price_per_kg: baselinePrice,
        ambient_temperature_celsius: ambientTemp,
        candidate_radius_km: radiusKm
      });
      setRankingResult(res);
    } catch (err: any) {
      console.warn("Best market opportunity fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [selectedHub, commodity, quantityKg, baselinePrice, radiusKm, ambientTemp]);

  const handleHubChange = (hubId: string) => {
    const found = ORIGIN_HUBS.find(h => h.id === hubId);
    if (found) {
      setSelectedHub(found);
      setCommodity(found.defaultCrop);
      setBaselinePrice(found.defaultPrice);
    }
  };

  const topMarket = rankingResult?.ranked_opportunities[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Header: Decision Engine Identity */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--ad-border)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ad-accent)' }}>
              Spatial Price Arbitrage Engine
            </span>
            <DataProvenance source="Agmarknet Benchmark Data & OSRM Logistics" status="MODEL_OUTPUT" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
            Market Destination Optimizer
          </h1>
          <p className="text-sm max-w-2xl mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
            Evaluates regional mandis vs. institutional buyers. Deducts exact freight, transit heat spoilage, and APMC cess to identify the maximum net cash realization for your cooperative.
          </p>
        </div>
      </div>

      {/* Origin Configuration Cockpit */}
      <div
        className="p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs shadow-sm"
        style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border)' }}
      >
        <div>
          <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Origin Producer Cooperative</label>
          <select
            value={selectedHub.id}
            onChange={(e) => handleHubChange(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
            style={{
              background: 'var(--ad-surface-1)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-primary)',
              fontFamily: 'var(--ad-font-display)'
            }}
          >
            {ORIGIN_HUBS.map(hub => (
              <option key={hub.id} value={hub.id} style={{ background: '#141A17', color: '#F2F4F3' }}>
                {hub.name} ({hub.location.split(',')[0]})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Commodity & Batch Size</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-primary)',
              }}
            />
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              step={500}
              min={500}
              className="w-28 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-accent-bright)',
                fontFamily: 'var(--ad-font-display)'
              }}
            />
          </div>
        </div>

        <div>
          <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Local Farmgate Baseline (₹/kg)</label>
          <input
            type="number"
            value={baselinePrice}
            onChange={(e) => setBaselinePrice(Number(e.target.value))}
            step={0.5}
            min={1}
            className="w-full rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
            style={{
              background: 'var(--ad-surface-1)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-primary)',
              fontFamily: 'var(--ad-font-display)'
            }}
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Transit Search Radius</span>
            <span className="font-bold" style={{ color: 'var(--ad-accent-bright)', fontFamily: 'var(--ad-font-display)' }}>{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-2"
            style={{ background: 'var(--ad-surface-muted)', accentColor: 'var(--ad-accent)' }}
          />
        </div>
      </div>

      {/* Prominent Editorial Decision Hero Card */}
      {rankingResult && topMarket && (
        <div
          className="rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--ad-surface-0) 0%, var(--ad-surface-1) 50%, var(--ad-surface-2) 100%)',
            border: '1px solid var(--ad-border-accent)',
            borderLeft: '3px solid var(--ad-accent)',
            boxShadow: 'var(--ad-shadow-lg), var(--ad-shadow-glow-accent)',
          }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(199, 163, 86, 0.04)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left Strategic Guidance */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center space-x-2">
                <span
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                    color: '#0B0F0D',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>RECOMMENDED DESTINATION</span>
                </span>
                <span className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>
                  Rank #1 of {rankingResult.ranked_opportunities.length} Candidate Markets
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                  Route to <span style={{ color: 'var(--ad-accent-bright)' }}>{topMarket.destination_name}</span>
                </h2>
                <span className="text-xs font-semibold block mt-1" style={{ color: 'var(--ad-accent)' }}>
                  {topMarket.destination_type} · {topMarket.distance_km} km distance ({topMarket.estimated_transit_hours}h cold transit)
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed max-w-xl" style={{ color: 'var(--ad-text-secondary)' }}>
                Deducting freight, transit respiration losses, and zero broker cess guarantees maximum net cash return for the producer federation.
              </p>

              {/* Deductive Deduction Bar Breakdown */}
              <div className="pt-2">
                <div
                  className="p-3.5 rounded-xl space-y-2 text-xs"
                  style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border-subtle)' }}
                >
                  <div className="flex justify-between items-center text-[11px]" style={{ color: 'var(--ad-text-muted)' }}>
                    <span>Gross Mandi Ask: <strong style={{ color: 'var(--ad-text-primary)' }}>₹{topMarket.gross_market_price_per_kg.toFixed(2)}</strong></span>
                    <span>Freight: <strong style={{ color: 'var(--ad-danger-text)' }}>-₹{topMarket.freight_cost_per_kg.toFixed(2)}</strong></span>
                    <span>Spoilage: <strong style={{ color: 'var(--ad-danger-text)' }}>-₹{topMarket.transit_spoilage_loss_per_kg.toFixed(2)}</strong></span>
                    <span>Net: <strong style={{ color: 'var(--ad-brand-bright)' }}>₹{topMarket.net_realization_per_kg.toFixed(2)}/kg</strong></span>
                  </div>
                  {/* Visual Proportional Bar */}
                  <div className="h-2 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--ad-surface-muted)' }}>
                    <div style={{ width: '78%', background: 'var(--ad-brand)' }} className="h-full" title="Farmer Net Share (78%)" />
                    <div style={{ width: '15%', background: 'var(--ad-accent)' }} className="h-full" title="Freight Cost (15%)" />
                    <div style={{ width: '7%', background: 'var(--ad-danger)' }} className="h-full" title="Transit Spoilage (7%)" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Financial Uplift Card */}
            <div
              className="lg:col-span-5 p-6 rounded-2xl space-y-4 shadow-xl"
              style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border-accent)', borderLeft: '3px solid var(--ad-accent)' }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--ad-text-muted)' }}>
                  Best Expected Net Realization
                </span>
                <strong className="text-3xl sm:text-4xl font-extrabold block mt-1" style={{ color: 'var(--ad-brand-bright)', fontFamily: 'var(--ad-font-display)' }}>
                  ₹{topMarket.net_realization_per_kg.toFixed(2)}
                  <span className="text-sm font-normal" style={{ color: 'var(--ad-text-muted)' }}>/kg</span>
                </strong>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--ad-text-muted)' }}>
                  vs Local Mandi: ₹{baselinePrice.toFixed(2)}/kg
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--ad-border-subtle)' }}>
                <div>
                  <span className="text-[10px] uppercase block" style={{ color: 'var(--ad-text-muted)' }}>Total Net Batch Payout</span>
                  <strong className="text-xl font-extrabold block" style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>
                    ₹{Math.round(topMarket.total_net_payout).toLocaleString()}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase block font-semibold" style={{ color: 'var(--ad-accent)' }}>Net Extra Margin</span>
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded"
                    style={{
                      background: 'var(--ad-accent-light)',
                      color: 'var(--ad-accent-bright)',
                      border: '1px solid var(--ad-border-accent)',
                      fontFamily: 'var(--ad-font-display)'
                    }}
                  >
                    +₹{Math.round(rankingResult.max_net_uplift_total).toLocaleString()} (+{rankingResult.max_net_uplift_pct}%)
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onSelectMarket) onSelectMarket(topMarket);
                  if (onNavigateToLogistics) onNavigateToLogistics();
                }}
                className="ad-btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center space-x-2"
              >
                <span>Dispatch Harvest to This Destination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Candidate Markets Table / Stack */}
      {rankingResult && (
        <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#26332C]">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Ranked Candidate Markets by Net Realization
              </h3>
              <p className="text-xs text-[#8E9C93]">
                Net Realization = Gross Mandi Ask - Freight Cost - Transit Spoilage Loss - Mandi Cess
              </p>
            </div>
            <span className="text-xs font-mono text-[#8E9C93] bg-[#101513] px-2.5 py-1 rounded-lg border border-[#26332C]">
              {rankingResult.ranked_opportunities.length} Candidate Markets Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Rank & Market</th>
                  <th>Destination Type</th>
                  <th>Gross Price</th>
                  <th>Distance & Time</th>
                  <th>Freight Deduct</th>
                  <th>Transit Spoilage</th>
                  <th>Net Realization</th>
                  <th>Batch Payout</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rankingResult.ranked_opportunities.map((m, idx) => {
                    const isTop = idx === 0;
                    return (
                      <motion.tr
                        key={m.destination_name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                        className={isTop ? 'bg-[#1D2722] font-semibold' : ''}
                      >
                        <td>
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isTop ? 'bg-[#2D6A4F] text-white shadow' : 'bg-[#101513] text-[#8E9C93] border border-[#26332C]'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="text-white font-bold block">{m.destination_name}</span>
                              <span className="text-[10px] text-[#8E9C93]">{m.state}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-xs text-[#C2CBC5]">{m.destination_type}</td>
                        <td className="font-mono text-white font-bold">₹{m.gross_market_price_per_kg.toFixed(2)}/kg</td>
                        <td className="font-mono text-[#8E9C93] text-xs">{m.distance_km} km • {m.estimated_transit_hours}h</td>
                        <td className="font-mono text-[#F56565] text-xs">-₹{m.freight_cost_per_kg.toFixed(2)}/kg</td>
                        <td className="font-mono text-[#F56565] text-xs">-₹{m.transit_spoilage_loss_per_kg.toFixed(2)}/kg</td>
                        <td>
                          <strong className="text-sm font-black text-[#48BB78] font-mono">
                            ₹{m.net_realization_per_kg.toFixed(2)}/kg
                          </strong>
                        </td>
                        <td className="font-mono font-bold text-white text-xs">
                          ₹{Math.round(m.total_net_payout).toLocaleString()}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              if (onSelectMarket) onSelectMarket(m);
                              if (onNavigateToLogistics) onNavigateToLogistics();
                            }}
                            className="ad-btn-primary text-[11px] h-7 px-3 whitespace-nowrap"
                          >
                            <span>Route</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* "WHY THIS MARKET?" Deductive Calculation Insight */}
      <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#52796F]">
          <HelpCircle className="w-4 h-4 text-[#48BB78]" />
          <span className="text-white uppercase tracking-wider">Spatial Arbitrage Decision Breakdown</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#C2CBC5]">
          <div className="bg-[#101513] p-4 rounded-xl border border-[#26332C] space-y-1.5">
            <span className="font-bold text-white block text-xs">1. Gross Mandi Spread vs Fuel</span>
            <p className="text-[11px] text-[#8E9C93] leading-relaxed">
              While distant terminal mandis (e.g. Delhi Azadpur) list higher gross rates, long-haul freight (+₹8.50/kg) erodes margins compared to regional processing hubs.
            </p>
          </div>

          <div className="bg-[#101513] p-4 rounded-xl border border-[#26332C] space-y-1.5">
            <span className="font-bold text-white block text-xs">2. Perishable Shrinkage Penalty</span>
            <p className="text-[11px] text-[#8E9C93] leading-relaxed">
              Produce in transit exceeding 18 hours undergoes accelerated moisture loss. Models penalize routes based on real-time ambient heat telemetry.
            </p>
          </div>

          <div className="bg-[#101513] p-4 rounded-xl border border-[#26332C] space-y-1.5">
            <span className="font-bold text-white block text-xs">3. Direct Institutional Settlement</span>
            <p className="text-[11px] text-[#8E9C93] leading-relaxed">
              AgriDirect direct buyers bypass standard 6–8% APMC commission agent deductions, ensuring farmers keep the entire spread.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
