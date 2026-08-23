import React, { useEffect, useState } from 'react';
import { CropListing, PriceBreakdown } from '../../types';
import { fetchListings, fetchPriceBreakdown } from '../../services/api';
import { Search, Filter, ShoppingBag, ShieldCheck, MapPin, Calendar, Clock, Calculator, ArrowRight, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const BuyerPortalView: React.FC = () => {
  const [listings, setListings] = useState<CropListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<CropListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Interactive Calculator State
  const [orderQuantity, setOrderQuantity] = useState<number>(1000);
  const [transitDistance, setTransitDistance] = useState<number>(140);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings().then(res => {
      setListings(res);
      if (res.length > 0) {
        setSelectedListing(res[0]);
        setOrderQuantity(res[0].quantity_kg);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedListing) {
      fetchPriceBreakdown(
        selectedListing.price_per_kg,
        orderQuantity,
        transitDistance,
        selectedListing.middleman_baseline_price,
        selectedListing.consumer_benchmark_price
      ).then(res => setBreakdown(res));
    }
  }, [selectedListing, orderQuantity, transitDistance]);

  const filteredListings = listings.filter(item => {
    const matchesSearch = item.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) || item.fpo_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const handlePlaceOrder = () => {
    setOrderConfirmed(true);
    setTimeout(() => setOrderConfirmed(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Direct FPO & Farmer Produce Marketplace</h1>
          <p className="text-xs text-slate-300 mt-1">
            Eliminate middleman markups. Buy direct from verified Indian Farmer Producer Organizations (FPOs).
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search wheat, tomato, FPO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'VEGETABLES', 'CEREALS'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCategory === cat ? 'bg-emerald-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Listings vs Fair Price Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Produce Listings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Available Produce Batches ({filteredListings.length})</h2>
            <span className="text-xs text-emerald-400 font-mono">100% Quality Inspected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredListings.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedListing(item);
                  setOrderQuantity(item.quantity_kg);
                }}
                className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedListing?.id === item.id
                    ? 'border-emerald-500 bg-slate-800/80 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {item.grade}
                    </span>
                    <h3 className="font-bold text-slate-100 text-base mt-1.5">{item.crop_name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{item.fpo_name}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-400 block">Farmer Target</span>
                    <span className="text-lg font-black text-emerald-400">₹{item.price_per_kg}</span>
                    <span className="text-[10px] text-slate-400 block">/ kg</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{item.location_name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.quantity_kg.toLocaleString()} kg total</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Harvested: {item.harvest_date}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shelf Life: {item.shelf_life_days} days</span>
                  </div>
                </div>

                <div className="mt-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between text-slate-300 font-mono">
                  <span>Broker Payout: <s className="text-rose-400">₹{item.middleman_baseline_price}</s></span>
                  <span className="text-emerald-400 font-bold">Uplift: +{Math.round(((item.price_per_kg - item.middleman_baseline_price)/item.middleman_baseline_price)*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Fair Price Engine & Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          {selectedListing && breakdown ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 sticky top-20 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">Interactive Disintermediation Engine</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedListing.crop_name} Fair Price Breakdown</h2>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
              </div>

              {/* Sliders for Quantity & Distance */}
              <div className="space-y-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-300">Order Quantity:</span>
                    <span className="text-emerald-400 font-mono font-bold">{orderQuantity.toLocaleString()} kg</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max={selectedListing.quantity_kg}
                    step="100"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-300">Transit Distance:</span>
                    <span className="text-cyan-400 font-mono font-bold">{transitDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={transitDistance}
                    onChange={(e) => setTransitDistance(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Detailed Mathematical Cost Breakdown */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span>Farmer Base Target Payout:</span>
                  <span>₹{breakdown.farmer_price_per_kg} / kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span>Pooled VRP Logistics Fee:</span>
                  <span>₹{breakdown.logistics_cost_per_kg} / kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span>Platform Quality & Escrow (1.5%):</span>
                  <span>₹{breakdown.platform_fee_per_kg} / kg</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold text-white bg-slate-900 px-3 rounded-lg border border-slate-800">
                  <span>Direct Cost to Buyer:</span>
                  <span className="text-emerald-400">₹{breakdown.direct_consumer_price_per_kg} / kg</span>
                </div>
              </div>

              {/* Economic Impact Comparison Box */}
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Traditional Urban Retail Benchmark:</span>
                  <s className="text-rose-400 font-mono">₹{breakdown.consumer_benchmark_retail_price_per_kg}/kg</s>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Farmer Middleman Baseline Payout:</span>
                  <s className="text-amber-400 font-mono">₹{breakdown.middleman_baseline_price_per_kg}/kg</s>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-xs">
                  <span className="text-emerald-400">Net Farmer Payout Increase:</span>
                  <span className="text-emerald-400 font-mono">+₹{breakdown.farmer_earnings_uplift_amount.toLocaleString()} (+{breakdown.farmer_earnings_uplift_percent}%)</span>
                </div>
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-cyan-400">Net Buyer Cost Savings:</span>
                  <span className="text-cyan-400 font-mono">-₹{breakdown.consumer_savings_amount.toLocaleString()} (-{breakdown.consumer_savings_percent}%)</span>
                </div>
              </div>

              {/* Action Button */}
              {orderConfirmed ? (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Direct Order Confirmed! Escrow locked.</span>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Place Direct Order (₹{breakdown.total_consumer_cost_direct.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
