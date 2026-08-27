import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Sprout,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Building2,
  Tag,
  Layers,
  ArrowRight,
  ShieldCheck,
  Scale,
  Truck,
  Warehouse,
  Split,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import {
  evaluateBatchDecision,
  fetchBestMarketOpportunities,
  fetchActiveMarketEvents
} from '../../services/api';
import {
  BatchDecisionResult,
  OpportunityRankingResult,
  MarketEvent
} from '../../types';
import { DataProvenance } from '../ui/DataProvenance';

interface FarmerPortalViewProps {
  onNavigateToMarketplace?: () => void;
}

interface FPOPreset {
  id: string;
  name: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  defaultCrop: string;
  defaultCategory: string;
  defaultTargetPrice: number;
  defaultBrokerPrice: number;
  defaultRetailPrice: number;
}

const FPO_PRESETS: FPOPreset[] = [
  {
    id: 'ludhiana',
    name: 'Ludhiana Agri Cooperative',
    location: 'Ludhiana Farm Cluster, Punjab',
    state: 'Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
    defaultCrop: 'Wheat (Kalyan Sona)',
    defaultCategory: 'Cereals',
    defaultTargetPrice: 25.0,
    defaultBrokerPrice: 21.0,
    defaultRetailPrice: 35.0,
  },
  {
    id: 'nashik',
    name: 'Nashik Farmer Producer Co',
    location: 'Lasalgaon Farm Hub, Nashik, Maharashtra',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    defaultCrop: 'Red Onion (Nashik Quality)',
    defaultCategory: 'Vegetables',
    defaultTargetPrice: 23.0,
    defaultBrokerPrice: 17.5,
    defaultRetailPrice: 38.0,
  },
  {
    id: 'kolar',
    name: 'Kolar Tomato Growers Union',
    location: 'Kolar Agri Cluster, Karnataka',
    state: 'Karnataka',
    latitude: 13.1367,
    longitude: 78.1292,
    defaultCrop: 'Hybrid Red Tomato',
    defaultCategory: 'Vegetables',
    defaultTargetPrice: 32.0,
    defaultBrokerPrice: 24.0,
    defaultRetailPrice: 52.0,
  },
  {
    id: 'agra',
    name: 'Agra Potato Producers FPO',
    location: 'Agra Farm Hub, Uttar Pradesh',
    state: 'Uttar Pradesh',
    latitude: 27.1767,
    longitude: 78.0081,
    defaultCrop: 'White Potato (Desi Jyoti)',
    defaultCategory: 'Vegetables',
    defaultTargetPrice: 18.0,
    defaultBrokerPrice: 13.5,
    defaultRetailPrice: 28.0,
  }
];

const CROP_CATALOG: Record<string, string[]> = {
  Vegetables: [
    'Hybrid Red Tomato',
    'Red Onion (Nashik Quality)',
    'White Potato (Desi Jyoti)',
    'Green Cauliflower',
    'Fresh Green Peas',
    'Green Bell Pepper (Capsicum)',
    'Organic Spinach'
  ],
  Cereals: [
    'Wheat (Kalyan Sona)',
    'Basmati Paddy Rice (1121)',
    'Yellow Maize (Corn)',
    'Pearl Millet (Bajra)'
  ],
  Fruits: [
    'Nagpur Orange',
    'Alphonso Mango',
    'Shimla Royal Apple',
    'Nashik Thompson Seedless Grapes',
    'Robusta Banana'
  ],
  Pulses: [
    'Chana Dal (Chickpeas)',
    'Toor / Arhar Dal',
    'Green Moong Whole',
    'Urad Dal'
  ]
};

export const FarmerPortalView: React.FC<FarmerPortalViewProps> = ({ onNavigateToMarketplace }) => {
  const [activeTab, setActiveTab] = useState<'LISTING' | 'DECISION' | 'OPPORTUNITIES'>('LISTING');

  // Form State
  const [selectedFPOId, setSelectedFPOId] = useState('kolar');
  const [fpoName, setFpoName] = useState('Kolar Tomato Growers Union');
  const [cropName, setCropName] = useState('Hybrid Red Tomato');
  const [category, setCategory] = useState('Vegetables');
  const [grade, setGrade] = useState('Grade A Fresh');
  const [quantity, setQuantity] = useState(3500);
  const [targetPrice, setTargetPrice] = useState(28.0);
  const [middlemanPrice, setMiddlemanPrice] = useState(21.0);
  const [retailPrice, setRetailPrice] = useState(45.0);
  const [location, setLocation] = useState('Kolar Agri Cluster, Karnataka');
  const [latitude, setLatitude] = useState(13.1367);
  const [longitude, setLongitude] = useState(78.1292);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Decision Cockpit State
  const [decisionResult, setDecisionResult] = useState<BatchDecisionResult | null>(null);
  const [isEvaluatingDecision, setIsEvaluatingDecision] = useState(false);
  const [minCashNeedPct, setMinCashNeedPct] = useState(30);

  // Market Opportunities State
  const [opportunityResult, setOpportunityResult] = useState<OpportunityRankingResult | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [candidateRadius, setCandidateRadius] = useState(500);

  // Market Events
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);

  useEffect(() => {
    fetchActiveMarketEvents().then(setMarketEvents);
  }, []);

  const handleFPOChange = (fpoId: string) => {
    setSelectedFPOId(fpoId);
    const preset = FPO_PRESETS.find(f => f.id === fpoId);
    if (preset) {
      setFpoName(preset.name);
      setLocation(preset.location);
      setLatitude(preset.latitude);
      setLongitude(preset.longitude);
      setCategory(preset.defaultCategory);
      setCropName(preset.defaultCrop);
      setTargetPrice(preset.defaultTargetPrice);
      setMiddlemanPrice(preset.defaultBrokerPrice);
      setRetailPrice(preset.defaultRetailPrice);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const availableCrops = CROP_CATALOG[newCat] || [];
    if (availableCrops.length > 0) {
      setCropName(availableCrops[0]);
    }
  };

  const handleEvaluateDecision = async () => {
    setIsEvaluatingDecision(true);
    try {
      const res = await evaluateBatchDecision({
        commodity: cropName.split(' ')[0],
        quantity_kg: quantity,
        current_local_price_per_kg: targetPrice,
        shelf_life_days: category === 'Vegetables' ? 12 : 60,
        storage_cost_per_kg_day: 0.08,
        min_cash_need_pct: minCashNeedPct
      });
      setDecisionResult(res);
    } finally {
      setIsEvaluatingDecision(false);
    }
  };

  const handleFetchOpportunities = async () => {
    setIsLoadingOpportunities(true);
    try {
      const res = await fetchBestMarketOpportunities({
        commodity: cropName.split(' ')[0],
        quantity_kg: quantity,
        origin_location: location,
        origin_latitude: latitude,
        origin_longitude: longitude,
        local_baseline_price_per_kg: targetPrice,
        candidate_radius_km: candidateRadius
      });
      setOpportunityResult(res);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api/v1';
      const payload = {
        fpo_name: fpoName,
        crop_name: cropName,
        category: category,
        grade: grade,
        quantity_kg: Number(quantity),
        price_per_kg: Number(targetPrice),
        middleman_baseline_price: Number(middlemanPrice),
        consumer_benchmark_price: Number(retailPrice),
        harvest_date: new Date().toISOString().split('T')[0],
        shelf_life_days: category === 'Vegetables' ? 14 : 120,
        latitude: latitude,
        longitude: longitude,
        location_name: location
      };

      await fetch(`${apiBase}/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const directTotal = quantity * targetPrice;
  const brokerTotal = quantity * middlemanPrice;
  const netUplift = directTotal - brokerTotal;
  const upliftPercent = brokerTotal > 0 ? Math.round((netUplift / brokerTotal) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-2 rounded-2xl border border-slate-800 gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('LISTING')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
              activeTab === 'LISTING'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Direct Produce Listing</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('DECISION');
              if (!decisionResult) handleEvaluateDecision();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
              activeTab === 'DECISION'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Batch Decision Engine</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('OPPORTUNITIES');
              if (!opportunityResult) handleFetchOpportunities();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
              activeTab === 'OPPORTUNITIES'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Best Market Opportunities</span>
          </button>
        </div>

        <div className="px-2">
          <DataProvenance source="Verified FPO Registry" status="OBSERVED" />
        </div>
      </div>

      {/* Active Market Shocks Banner */}
      {marketEvents.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-300 flex items-center space-x-2">
              <span>Active Regional Disruption Alert:</span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono">
                {marketEvents[0].category}
              </span>
            </div>
            <p className="text-slate-300 mt-0.5">{marketEvents[0].title}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Impact on {marketEvents[0].affected_commodities.join(', ')}: Price Multiplier ×{marketEvents[0].price_shock_multiplier} ({marketEvents[0].supply_impact_pct}% supply contraction). Source: {marketEvents[0].source}.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: LISTING */}
      {activeTab === 'LISTING' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                Farmer & FPO Producer Portal
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-1">List Produce Batch for Direct Buyer Sale</h1>
              <p className="text-xs text-slate-400">Bypass regional commission brokers. Set your fair target price directly.</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
          </div>

          <form onSubmit={handleSubmitListing} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Farmer Producer Organization (FPO / Cooperative):</span>
                </label>
                <select
                  value={selectedFPOId}
                  onChange={(e) => handleFPOChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs sm:text-sm"
                >
                  {FPO_PRESETS.map(fpo => (
                    <option key={fpo.id} value={fpo.id}>
                      {fpo.name} — {fpo.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Crop Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {Object.keys(CROP_CATALOG).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Crop Variety</label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {(CROP_CATALOG[category] || []).map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Quantity (Kilograms)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  min="100"
                  step="50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Direct Price (₹ / kg)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  step="0.5"
                  required
                />
              </div>
            </div>

            {/* FairPrice Real-Time Uplift Summary */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Farmer Direct Realization</span>
                <div className="text-xl font-extrabold text-white">₹{directTotal.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  vs Broker Payout ₹{brokerTotal.toLocaleString()} (+{upliftPercent}% Net Uplift)
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Batch Listing'}</span>
              </button>
            </div>

            {submitted && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Batch listing published successfully to direct buyer marketplace!</span>
                </div>
                {onNavigateToMarketplace && (
                  <button
                    onClick={onNavigateToMarketplace}
                    className="underline text-emerald-400 font-bold hover:text-emerald-300"
                  >
                    View in Marketplace →
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: DECISION ENGINE */}
      {activeTab === 'DECISION' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                AI Agricultural Decision Engine
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Optimal Batch Allocation: Sell / Store / Move / Split</h2>
              <p className="text-xs text-slate-400">
                Mathematical optimization comparing storage fees, transit costs, and price appreciation to maximize net realization.
              </p>
            </div>
            <button
              onClick={handleEvaluateDecision}
              disabled={isEvaluatingDecision}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2"
            >
              <Scale className="w-4 h-4" />
              <span>{isEvaluatingDecision ? 'Calculating...' : 'Re-Evaluate Payoff'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Batch Quantity (kg)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Current Spot Price (₹/kg)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Immediate Cash Need (%) for SPLIT</label>
              <input
                type="number"
                value={minCashNeedPct}
                onChange={(e) => setMinCashNeedPct(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Decision Comparison Cards */}
          {decisionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold uppercase">Optimal Action Recommendation</span>
                    <h3 className="text-2xl font-black text-emerald-300 mt-0.5">
                      {decisionResult.optimal_action}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">{decisionResult.recommendation_summary}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Max Net Realization</span>
                    <div className="text-2xl font-extrabold text-white">₹{decisionResult.optimal_net_revenue.toLocaleString()}</div>
                    <span className="text-xs text-emerald-400 font-bold">+{decisionResult.net_uplift_pct}% vs Spot Sale</span>
                  </div>
                </div>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {decisionResult.options_comparison.map(opt => {
                  const isOptimal = opt.action === decisionResult.optimal_action;
                  return (
                    <div
                      key={opt.action}
                      className={`glass-panel p-4 rounded-xl border transition-all ${
                        isOptimal
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-200">{opt.action}</span>
                        {isOptimal && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-extrabold text-white">₹{opt.expected_net_revenue.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">₹{opt.expected_price_per_kg}/kg realized</div>
                      <div className={`mt-2 text-[11px] font-bold ${opt.revenue_uplift_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {opt.revenue_uplift_pct >= 0 ? `+${opt.revenue_uplift_pct}%` : `${opt.revenue_uplift_pct}%`} net uplift
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">Risk: {opt.risk_level}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MARKET OPPORTUNITIES */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="bg-purple-500/20 text-purple-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                Best Market & Buyer Opportunity Engine
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Regional Mandis & Direct Institutional Buyers</h2>
              <p className="text-xs text-slate-400">
                Ranked by Net Realization after deducting logistics freight, handling fees, and temperature-adjusted transit spoilage.
              </p>
            </div>
            <button
              onClick={handleFetchOpportunities}
              disabled={isLoadingOpportunities}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>{isLoadingOpportunities ? 'Scanning...' : 'Scan Opportunities'}</span>
            </button>
          </div>

          {opportunityResult && (
            <div className="space-y-4">
              {/* Opportunities Table */}
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Rank & Destination</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Distance & Transit</th>
                      <th className="p-3">Gross Price</th>
                      <th className="p-3">Freight & Spoilage</th>
                      <th className="p-3">Net Realization</th>
                      <th className="p-3 text-right">Net Uplift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {opportunityResult.ranked_opportunities.map(opp => (
                      <tr key={opp.destination_name} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px]">
                              {opp.rank}
                            </span>
                            <span>{opp.destination_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 ml-7">{opp.state}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            opp.destination_type === 'INSTITUTIONAL_BUYER'
                              ? 'bg-blue-500/20 text-blue-300'
                              : opp.destination_type === 'PROCESSING_PLANT'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {opp.destination_type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {opp.distance_km} km ({opp.estimated_transit_hours}h)
                        </td>
                        <td className="p-3 font-mono font-bold text-white">
                          ₹{opp.gross_market_price_per_kg}/kg
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          -₹{(opp.freight_cost_per_kg + opp.transit_spoilage_loss_per_kg).toFixed(2)}/kg
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                          ₹{opp.net_realization_per_kg}/kg
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-emerald-400 font-mono">
                            +{opp.net_uplift_percent}%
                          </span>
                          <div className="text-[10px] text-slate-400">
                            +₹{opp.net_uplift_amount_total.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
