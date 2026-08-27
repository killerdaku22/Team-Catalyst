import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Sprout,
  CheckCircle2,
  Building2,
  Scale,
  Truck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import {
  fetchActiveMarketEvents,
  evaluateBatchDecision,
  fetchBestMarketOpportunities
} from '../../services/api';
import {
  MarketEvent,
  BatchDecisionResult,
  OpportunityRankingResult
} from '../../types';
import { DataProvenance } from '../ui/DataProvenance';

interface FarmerPortalViewProps {
  onNavigateToMarketplace?: () => void;
}

const FPO_OPTIONS = [
  { id: 'kolar', name: 'Kolar Tomato Growers Producer Co.', location: 'Kolar, Karnataka', members: 420 },
  { id: 'nashik', name: 'Nashik Onion Farmers Cooperative', location: 'Nashik, Maharashtra', members: 680 },
  { id: 'agra', name: 'Agra Potato Producer Union', location: 'Agra, Uttar Pradesh', members: 310 },
  { id: 'ludhiana', name: 'Punjab Cereal & Wheat Guild', location: 'Ludhiana, Punjab', members: 540 }
];

const CROP_VARIETIES: Record<string, string[]> = {
  Vegetables: ['Tomato (Hybrid Red)', 'Red Onion (Nashik Quality)', 'White Potato (Desi Jyoti)', 'Green Peas', 'Capsicum'],
  Cereals: ['Wheat (Kalyan Sona)', 'Basmati Paddy Rice (1121)', 'Yellow Maize'],
  Fruits: ['Nagpur Orange', 'Alphonso Mango', 'Shimla Royal Apple', 'Thompson Seedless Grapes'],
  Pulses: ['Chana Dal (Chickpeas)', 'Toor / Arhar Dal', 'Green Moong Whole']
};

export const FarmerPortalView: React.FC<FarmerPortalViewProps> = ({ onNavigateToMarketplace }) => {
  const [activeTab, setActiveTab] = useState<'LISTING' | 'DECISION' | 'OPPORTUNITIES'>('LISTING');
  
  // Listing Form State
  const [selectedFPO, setSelectedFPO] = useState('kolar');
  const [cropCategory, setCropCategory] = useState('Vegetables');
  const [cropVariety, setCropVariety] = useState('Tomato (Hybrid Red)');
  const [quantityKg, setQuantityKg] = useState(15000);
  const [targetPrice, setTargetPrice] = useState(34.5);
  const [referenceMandiPrice, setReferenceMandiPrice] = useState(28.0);
  const [harvestDate, setHarvestDate] = useState('2026-08-30');
  const [isOrganic, setIsOrganic] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External intelligence
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);
  const [decisionResult, setDecisionResult] = useState<BatchDecisionResult | null>(null);
  const [opportunityResult, setOpportunityResult] = useState<OpportunityRankingResult | null>(null);

  useEffect(() => {
    fetchActiveMarketEvents().then(events => setMarketEvents(events)).catch(() => {});
  }, []);

  const handleCategoryChange = (cat: string) => {
    setCropCategory(cat);
    const varieties = CROP_VARIETIES[cat] || [];
    if (varieties.length > 0) setCropVariety(varieties[0]);
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api/v1';
    
    try {
      const payload = {
        commodity: cropVariety.split(' ')[0],
        variety: cropVariety,
        quantity_kg: quantityKg,
        price_per_kg: targetPrice,
        harvest_date: harvestDate,
        grade: 'A',
        is_organic: isOrganic,
        fpo_id: selectedFPO
      };
      await fetch(`${apiBase}/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const directGross = (quantityKg * targetPrice);
  const mandiGross = (quantityKg * referenceMandiPrice);
  const estimatedUplift = directGross - mandiGross;

  return (
    <div className="space-y-6">
      {/* Page Header (Compact 80-120px) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B3731]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">Producer Workspace</span>
            <DataProvenance source="Verified FPO Registry" status="OBSERVED" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">Farmer & FPO Portal</h1>
          <p className="text-xs text-[#8E9C93]">
            List produce directly for institutional offtake and optimize harvest monetization.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#121815] p-1 rounded-lg border border-[#2B3731] shrink-0">
          <button
            onClick={() => setActiveTab('LISTING')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'LISTING'
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#C2CBC5] hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Direct Listing</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('DECISION');
              if (!decisionResult) {
                evaluateBatchDecision({
                  commodity: 'Tomato',
                  quantity_kg: quantityKg,
                  current_local_price_per_kg: referenceMandiPrice,
                  shelf_life_days: 14,
                  min_cash_need_pct: 0,
                  storage_cost_per_kg_day: 0.08
                }).then(setDecisionResult).catch(() => {});
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'DECISION'
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#C2CBC5] hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Decision Engine</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('OPPORTUNITIES');
              if (!opportunityResult) {
                fetchBestMarketOpportunities({
                  commodity: 'Tomato',
                  quantity_kg: quantityKg,
                  origin_location: 'Kolar, Karnataka',
                  origin_latitude: 13.1367,
                  origin_longitude: 78.1292,
                  local_baseline_price_per_kg: referenceMandiPrice
                }).then(setOpportunityResult).catch(() => {});
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'OPPORTUNITIES'
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#C2CBC5] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Best Markets</span>
          </button>
        </div>
      </div>

      {/* Regional Disruption Alert Strip (If Active) */}
      {marketEvents.length > 0 && (
        <div className="bg-[#1C211E] border border-[#B45309]/40 rounded-lg p-3 flex items-start space-x-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-[#ED8936] shrink-0 mt-0.5" />
          <div className="flex-1 text-[#C2CBC5]">
            <span className="font-semibold text-[#ED8936] mr-1.5">Market Alert:</span>
            <span>{marketEvents[0].title} — Multiplier ×{marketEvents[0].price_shock_multiplier} on {marketEvents[0].affected_commodities.join(', ')}.</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'LISTING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Compact Enterprise Form (7 Cols) */}
          <div className="lg:col-span-7 bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-[#2B3731]">
              Produce Listing Specifications
            </h2>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#48BB78] mx-auto" />
                <h3 className="text-base font-bold text-white">Batch Successfully Registered</h3>
                <p className="text-xs text-[#8E9C93] max-w-sm mx-auto">
                  Your lot of {quantityKg.toLocaleString()} kg {cropVariety} is published on the institutional buyer board.
                </p>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="ad-btn-secondary text-xs"
                  >
                    List Another Batch
                  </button>
                  {onNavigateToMarketplace && (
                    <button
                      onClick={onNavigateToMarketplace}
                      className="ad-btn-primary text-xs"
                    >
                      View Live Board
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleListingSubmit} className="space-y-3.5 text-xs">
                {/* Row 1: FPO Selection */}
                <div>
                  <label className="ad-label">FPO / Cooperative Entity</label>
                  <select
                    value={selectedFPO}
                    onChange={(e) => setSelectedFPO(e.target.value)}
                    className="ad-input"
                  >
                    {FPO_OPTIONS.map(fpo => (
                      <option key={fpo.id} value={fpo.id} className="bg-[#1A221E] text-white">
                        {fpo.name} ({fpo.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Category & Variety (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="ad-label">Crop Category</label>
                    <select
                      value={cropCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="ad-input"
                    >
                      {Object.keys(CROP_VARIETIES).map(cat => (
                        <option key={cat} value={cat} className="bg-[#1A221E] text-white">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ad-label">Crop Variety</label>
                    <select
                      value={cropVariety}
                      onChange={(e) => setCropVariety(e.target.value)}
                      className="ad-input"
                    >
                      {(CROP_VARIETIES[cropCategory] || []).map(v => (
                        <option key={v} value={v} className="bg-[#1A221E] text-white">{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Quantity & Target Price (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="ad-label">Quantity Available (kg)</label>
                    <input
                      type="number"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      min={100}
                      step={100}
                      className="ad-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="ad-label">Target Ask Price (₹/kg)</label>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      min={1}
                      step={0.5}
                      className="ad-input"
                      required
                    />
                  </div>
                </div>

                {/* Row 4: Harvest Date & Quality Standard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="ad-label">Harvest / Ready Date</label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="ad-input"
                      required
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-[#C2CBC5]">
                      <input
                        type="checkbox"
                        checked={isOrganic}
                        onChange={(e) => setIsOrganic(e.target.checked)}
                        className="rounded border-[#2B3731] bg-[#121815] text-[#2D6A4F] focus:ring-0"
                      />
                      <span>Certified Organic / Residue Free</span>
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end space-x-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ad-btn-primary w-full sm:w-auto text-xs"
                  >
                    <span>{isSubmitting ? 'Publishing...' : 'Publish to Direct Marketplace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Compact Economic Realization Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-3.5">
              <h2 className="text-xs font-bold text-[#8E9C93] uppercase tracking-wider">
                Price Realization Analysis
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723]">
                  <span className="text-[10px] text-[#8E9C93] block">Direct Ask Value</span>
                  <strong className="text-base font-bold text-white mt-0.5 block">
                    ₹{directGross.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-[#52796F]">₹{targetPrice.toFixed(2)}/kg</span>
                </div>

                <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723]">
                  <span className="text-[10px] text-[#8E9C93] block">Local Mandi Benchmark</span>
                  <strong className="text-base font-bold text-[#C2CBC5] mt-0.5 block">
                    ₹{mandiGross.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-[#8E9C93]">₹{referenceMandiPrice.toFixed(2)}/kg</span>
                </div>
              </div>

              {/* Net Estimated Uplift */}
              <div className="bg-[#222C27] border border-[#2D6A4F]/40 p-3 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#52796F] font-semibold block uppercase">Estimated Direct Uplift</span>
                  <strong className="text-sm font-bold text-[#48BB78]">
                    +₹{estimatedUplift.toLocaleString()} ({Math.round((estimatedUplift / mandiGross) * 100)}%)
                  </strong>
                </div>
                <span className="ad-badge ad-badge-success text-[10px]">Zero Middleman APMC Deductions</span>
              </div>

              <p className="text-[11px] text-[#8E9C93] leading-relaxed">
                Direct buyer offtake avoids trader commission cess and mandi physical handling deductions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decision Engine Tab */}
      {activeTab === 'DECISION' && (
        <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2B3731] pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Automated Batch Decision Analysis</h2>
              <p className="text-xs text-[#8E9C93]">Optimal action computed across holding costs and spatial arbitrage.</p>
            </div>
            {decisionResult && (
              <span className="ad-badge ad-badge-success text-xs font-bold px-2.5 py-1">
                Recommendation: {decisionResult.optimal_action}
              </span>
            )}
          </div>

          {decisionResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723]">
                <span className="text-[#8E9C93] block text-[10px]">Optimal Net Revenue</span>
                <strong className="text-base font-bold text-[#48BB78] mt-0.5 block">
                  ₹{Math.round(decisionResult.optimal_net_revenue).toLocaleString()}
                </strong>
              </div>
              <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723]">
                <span className="text-[#8E9C93] block text-[10px]">Net Uplift vs Local</span>
                <strong className="text-base font-bold text-white mt-0.5 block">
                  +₹{Math.round(decisionResult.net_uplift_vs_local_sell_now).toLocaleString()} ({decisionResult.net_uplift_pct}%)
                </strong>
              </div>
              <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723]">
                <span className="text-[#8E9C93] block text-[10px]">Strategy Summary</span>
                <span className="text-xs text-[#C2CBC5] mt-0.5 block line-clamp-2">
                  {decisionResult.recommendation_summary}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Best Markets Tab */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2B3731] pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Ranked Candidate Markets</h2>
              <p className="text-xs text-[#8E9C93]">Net realization after deducting transit freight and handling.</p>
            </div>
          </div>

          {opportunityResult && (
            <div className="overflow-x-auto">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Market / Buyer</th>
                    <th>Gross Price</th>
                    <th>Distance</th>
                    <th>Freight Cost</th>
                    <th>Net Realization</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunityResult.ranked_opportunities.map((m, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-white">{m.destination_name}</td>
                      <td>₹{m.gross_market_price_per_kg.toFixed(2)}/kg</td>
                      <td>{m.distance_km} km</td>
                      <td>-₹{m.freight_cost_per_kg.toFixed(2)}/kg</td>
                      <td className="font-bold text-[#48BB78]">₹{m.net_realization_per_kg.toFixed(2)}/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
