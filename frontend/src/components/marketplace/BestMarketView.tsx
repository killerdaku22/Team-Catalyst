import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  Truck,
  Sparkles,
  Building,
  ShieldCheck,
  Scale,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { fetchBestMarketOpportunities } from '../../services/api';
import { OpportunityRankingResult, MarketOpportunityItem } from '../../types';
import { DataProvenance } from '../ui/DataProvenance';
import { CardSkeleton, TableSkeleton } from '../ui/LoadingState';

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
              Spatial Price Arbitrage & Net Realization Optimization
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              WHERE SHOULD THIS PRODUCE GO?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Ranking regional terminal mandis and institutional direct buyers by <strong>Expected Net Realization</strong> after accounting for Haversine freight, transit spoilage, and mandi handling cess.
            </p>
          </div>

          <DataProvenance source="AGMARKNET + Terminal Buyer Index" status="MODEL_OUTPUT" />
        </div>

        {/* Formula Transparency Banner */}
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold">Optimization Formula:</span>
            <span className="text-emerald-400 font-bold">Net Realization</span>
            <span>= Gross Price − Freight − Spoilage Loss − Mandi Fees</span>
          </div>
          <span className="text-[11px] text-cyan-400">Zero Middleman Disintermediation</span>
        </div>

        {/* Interactive Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Origin FPO Hub:</label>
            <select
              value={selectedHub.id}
              onChange={(e) => handleHubChange(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl p-2 border border-slate-700 font-medium"
            >
              {ORIGIN_HUBS.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Batch Size:</label>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              step="500"
              min="500"
              className="w-full bg-slate-900 text-white rounded-xl p-2 border border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Local Farmgate Baseline (₹/kg):</label>
            <input
              type="number"
              value={baselinePrice}
              onChange={(e) => setBaselinePrice(Number(e.target.value))}
              step="0.5"
              min="5"
              className="w-full bg-slate-900 text-amber-400 font-mono font-bold rounded-xl p-2 border border-slate-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 font-semibold mb-1">
              <span>Search Radius:</span>
              <span className="text-cyan-400 font-mono">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="100"
              max="1200"
              step="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-900 rounded-lg cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {loading || !rankingResult ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="space-y-6">
          {/* Top Recommendation Highlight Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/50 bg-emerald-950/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/40">
                  RANK #1 OPTIMAL DESTINATION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  {rankingResult.top_recommended_destination}
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Destination Type: <strong className="text-emerald-400">{rankingResult.top_destination_type.replace('_', ' ')}</strong>
                </p>
              </div>

              <div className="sm:text-right font-mono">
                <span className="text-xs text-slate-400">Net Realization Per Kg:</span>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{rankingResult.top_net_realization_per_kg.toFixed(2)}/kg
                </div>
                <span className="text-xs text-emerald-300 font-bold">
                  +{rankingResult.max_net_uplift_pct}% Net Uplift vs Local Distress Sale
                </span>
              </div>
            </div>

            {/* Total Net Payout vs Local Distress Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-2">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px]">LOCAL FARM REALIZATION</span>
                <div className="text-white font-bold text-sm">
                  ₹{(quantityKg * baselinePrice).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">@ ₹{baselinePrice}/kg Spot</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px]">TOTAL NET REVENUE</span>
                <div className="text-emerald-400 font-bold text-sm">
                  ₹{(quantityKg * rankingResult.top_net_realization_per_kg).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">After all transport & fees</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px]">TOTAL EXTRA PROFIT</span>
                <div className="text-emerald-300 font-bold text-sm">
                  +₹{rankingResult.max_net_uplift_total.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold">Farmer Earnings Uplift</span>
              </div>
            </div>
          </div>

          {/* Ranked Candidate Markets Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Ranked Candidate Markets (Deductive Realization Comparison)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {rankingResult.ranked_opportunities.length} Destinations Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Destination Market</th>
                    <th className="py-3 px-3">Channel Type</th>
                    <th className="py-3 px-3 text-right">Distance / Transit</th>
                    <th className="py-3 px-3 text-right">Gross Price</th>
                    <th className="py-3 px-3 text-right">Freight & Spoilage</th>
                    <th className="py-3 px-3 text-right">Net Realization</th>
                    <th className="py-3 px-3 text-right">Total Net Payout</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {rankingResult.ranked_opportunities.map((opp) => {
                    const isTop = opp.rank === 1;
                    return (
                      <tr key={opp.rank} className={isTop ? 'bg-emerald-950/25 font-bold' : 'hover:bg-slate-900/40'}>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            isTop ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{opp.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white font-medium">
                          {opp.destination_name}
                          <span className="block text-[10px] text-slate-400">{opp.state}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {opp.destination_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {opp.distance_km} km ({opp.estimated_transit_hours}h)
                        </td>
                        <td className="py-3 px-3 text-right text-white">
                          ₹{opp.gross_market_price_per_kg.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-400">
                          -₹{(opp.freight_cost_per_kg + opp.transit_spoilage_loss_per_kg).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold text-sm">
                          ₹{opp.net_realization_per_kg.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-white font-bold">
                          ₹{opp.total_net_payout.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {onNavigateToLogistics && (
                            <button
                              onClick={onNavigateToLogistics}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all"
                            >
                              Dispatch
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
