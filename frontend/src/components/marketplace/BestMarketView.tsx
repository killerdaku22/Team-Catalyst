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
  HelpCircle
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
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header: Decision Engine Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B3731]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">Spatial Arbitrage Engine</span>
            <DataProvenance source="Verified Agmarknet & Distance Matrices" status="MODEL_OUTPUT" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Market Destination Optimizer
          </h1>
          <p className="text-xs text-[#8E9C93]">
            Solves: <em className="text-[#C2CBC5] not-italic font-semibold">"Where should this harvest be routed?"</em> — Deducts freight and transit spoilage to maximize net farmer realization.
          </p>
        </div>
      </div>

      {/* Origin Configuration Bar */}
      <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="ad-label">Origin Producer Hub</label>
          <select
            value={selectedHub.id}
            onChange={(e) => handleHubChange(e.target.value)}
            className="ad-input h-9 text-xs"
          >
            {ORIGIN_HUBS.map(hub => (
              <option key={hub.id} value={hub.id} className="bg-[#1A221E] text-white">
                {hub.name} ({hub.location.split(',')[0]})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ad-label">Commodity & Quantity</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="ad-input h-9 text-xs flex-1"
            />
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              step={500}
              min={500}
              className="ad-input h-9 text-xs w-28 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="ad-label">Local Baseline Price (₹/kg)</label>
          <input
            type="number"
            value={baselinePrice}
            onChange={(e) => setBaselinePrice(Number(e.target.value))}
            step={0.5}
            min={1}
            className="ad-input h-9 text-xs font-mono"
          />
        </div>

        <div>
          <label className="ad-label">Search Transit Radius: {radiusKm} km</label>
          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-1.5 bg-[#121815] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F] mt-2.5"
          />
        </div>
      </div>

      {/* Prominent Decision Output Banner */}
      {rankingResult && topMarket && (
        <div className="bg-[#1A221E] border-2 border-[#2D6A4F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2D6A4F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Main Calculated Net Realization */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="ad-badge ad-badge-success text-xs font-bold px-2 py-0.5">
                  Optimal Market Decision
                </span>
                <span className="text-xs text-[#8E9C93]">Rank #1 Out of {rankingResult.ranked_opportunities.length} Candidate Markets</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Route to: <span className="text-[#48BB78]">{topMarket.destination_name}</span>
              </h2>

              <p className="text-xs text-[#C2CBC5] leading-relaxed max-w-xl">
                Deducting {topMarket.distance_km} km freight and estimated transit shrinkage yields the highest net pocket payout for the cooperative.
              </p>
            </div>

            {/* Prominent Price & Uplift Metrics */}
            <div className="lg:col-span-5 bg-[#121815] p-4 rounded-xl border border-[#1F2723] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-[#8E9C93] uppercase tracking-wider block">Best Net Realization</span>
                <strong className="text-2xl sm:text-3xl font-black text-[#48BB78] font-mono block">
                  ₹{topMarket.net_realization_per_kg.toFixed(2)}
                  <span className="text-xs text-[#8E9C93] font-normal">/kg</span>
                </strong>
                <span className="text-[11px] text-[#52796F]">
                  Local Mandi: ₹{baselinePrice.toFixed(2)}/kg
                </span>
              </div>

              <div className="text-right border-l border-[#2B3731] pl-4">
                <span className="text-[10px] text-[#8E9C93] uppercase tracking-wider block">Batch Total Net Payout</span>
                <strong className="text-xl font-bold text-white font-mono block">
                  ₹{Math.round(topMarket.total_net_payout).toLocaleString()}
                </strong>
                <span className="text-xs font-bold text-[#48BB78]">
                  +₹{Math.round(rankingResult.max_net_uplift_total).toLocaleString()} (+{rankingResult.max_net_uplift_pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Candidate Markets Table / Stack */}
      {rankingResult && (
        <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2B3731]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Ranked Candidate Markets by Net Realization
              </h3>
              <p className="text-xs text-[#8E9C93]">
                Net Realization = Gross Mandi Ask - Freight Cost - Transit Spoilage Loss - Mandi Cess
              </p>
            </div>
            <span className="text-xs font-mono text-[#8E9C93]">
              {rankingResult.ranked_opportunities.length} Candidate Markets Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Rank & Market</th>
                  <th>Type / Region</th>
                  <th>Gross Ask Price</th>
                  <th>Distance</th>
                  <th>Freight Deduction</th>
                  <th>Transit Spoilage</th>
                  <th>Net Realization</th>
                  <th>Total Payout</th>
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className={isTop ? 'bg-[#222C27]/50 font-semibold' : ''}
                      >
                        <td>
                          <div className="flex items-center space-x-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isTop ? 'bg-[#2D6A4F] text-white' : 'bg-[#121815] text-[#8E9C93] border border-[#2B3731]'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-white font-bold">{m.destination_name}</span>
                          </div>
                        </td>
                        <td className="text-[#8E9C93]">{m.destination_type} ({m.state})</td>
                        <td className="font-mono text-white">₹{m.gross_market_price_per_kg.toFixed(2)}/kg</td>
                        <td className="font-mono text-[#8E9C93]">{m.distance_km} km ({m.estimated_transit_hours}h)</td>
                        <td className="font-mono text-[#991B1B]">-₹{m.freight_cost_per_kg.toFixed(2)}/kg</td>
                        <td className="font-mono text-[#991B1B]">-₹{m.transit_spoilage_loss_per_kg.toFixed(2)}/kg</td>
                        <td>
                          <strong className="text-sm font-bold text-[#48BB78] font-mono">
                            ₹{m.net_realization_per_kg.toFixed(2)}/kg
                          </strong>
                        </td>
                        <td className="font-mono font-bold text-white">
                          ₹{Math.round(m.total_net_payout).toLocaleString()}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              if (onSelectMarket) onSelectMarket(m);
                              if (onNavigateToLogistics) onNavigateToLogistics();
                            }}
                            className="ad-btn-primary text-[11px] h-7 px-2.5 whitespace-nowrap"
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

      {/* "WHY THIS MARKET?" Deductive Calculation Insight Section */}
      <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs text-[#52796F] font-bold">
          <HelpCircle className="w-4 h-4 text-[#48BB78]" />
          <span className="text-white uppercase tracking-wider">Why is this the optimal destination?</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#C2CBC5]">
          <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723] space-y-1">
            <span className="font-semibold text-white block">1. Gross Price Spread vs Distance</span>
            <p className="text-[11px] text-[#8E9C93]">
              While distant terminal mandis (e.g. Delhi) may offer ₹40/kg, long freight (+₹8.50/kg) erodes margin below nearby urban distribution hubs.
            </p>
          </div>

          <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723] space-y-1">
            <span className="font-semibold text-white block">2. Transit Heat & Spoilage Penalty</span>
            <p className="text-[11px] text-[#8E9C93]">
              Perishable crops incur non-linear shrinkage in transit exceeding 18 hours. Routes are penalised for ambient thermal degradation.
            </p>
          </div>

          <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723] space-y-1">
            <span className="font-semibold text-white block">3. Zero Middleman Broker Fees</span>
            <p className="text-[11px] text-[#8E9C93]">
              AgriDirect direct buyers bypass standard 6–8% APMC commission agent deductions, ensuring farmers keep the entire spread.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
