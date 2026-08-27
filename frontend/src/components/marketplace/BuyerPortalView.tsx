import React, { useEffect, useState } from 'react';
import {
  CropListing,
  PriceBreakdown,
  ProcurementContract,
  SettlementBreakdown
} from '../../types';
import {
  fetchListings,
  fetchPriceBreakdown,
  fetchContracts,
  createContract,
  inspectAndSettleContract
} from '../../services/api';
import {
  Search,
  Filter,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Calculator,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  PlusCircle,
  Building2,
  Sparkles,
  Award,
  Layers,
  Scale,
  DollarSign
} from 'lucide-react';
import { DataProvenance } from '../ui/DataProvenance';
import { CardSkeleton, TableSkeleton } from '../ui/LoadingState';

export const BuyerPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'CONTRACTS'>('MARKETPLACE');

  // Marketplace State
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

  // Contracts State
  const [contracts, setContracts] = useState<ProcurementContract[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [buyerOrg, setBuyerOrg] = useState('BigBasket North Regional Sourcing');
  const [buyerType, setBuyerType] = useState('INSTITUTIONAL_BUYER');
  const [contractCommodity, setContractCommodity] = useState('Tomato');
  const [contractQuantity, setContractQuantity] = useState(5000);
  const [offeredPrice, setOfferedPrice] = useState(32.0);
  const [deliveryHub, setDeliveryHub] = useState('BigBasket Manesar Central Sourcing Hub');
  const [deliveryDeadline, setDeliveryDeadline] = useState('2026-09-15');
  const [maxMoisture, setMaxMoisture] = useState(13.0);
  const [isPublishingContract, setIsPublishingContract] = useState(false);

  // Quality Inspection State
  const [selectedContractForInspection, setSelectedContractForInspection] = useState<ProcurementContract | null>(null);
  const [measuredMoisture, setMeasuredMoisture] = useState(12.5);
  const [foreignMatter, setForeignMatter] = useState(0.8);
  const [gradeConformance, setGradeConformance] = useState(true);
  const [inspectionSettlement, setInspectionSettlement] = useState<SettlementBreakdown | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchListings(),
      fetchContracts()
    ]).then(([listRes, ctrRes]) => {
      setListings(listRes);
      if (listRes.length > 0) {
        setSelectedListing(listRes[0]);
        setOrderQuantity(listRes[0].quantity_kg);
      }
      setContracts(ctrRes);
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
    const matchesSearch = item.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.fpo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const handleCreateContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishingContract(true);
    try {
      const newContract = await createContract({
        buyer_organization: buyerOrg,
        buyer_type: buyerType,
        commodity: contractCommodity,
        target_grade: "Grade A Institutional",
        required_quantity_kg: contractQuantity,
        offered_price_per_kg: offeredPrice,
        delivery_destination_hub: deliveryHub,
        delivery_deadline: deliveryDeadline,
        max_moisture_pct: maxMoisture
      });
      setContracts([newContract, ...contracts]);
      setShowCreateModal(false);
    } finally {
      setIsPublishingContract(false);
    }
  };

  const handleSettleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForInspection) return;
    setIsSettling(true);
    try {
      const settlement = await inspectAndSettleContract(selectedContractForInspection.id, {
        measured_moisture_pct: measuredMoisture,
        foreign_matter_pct: foreignMatter,
        grade_conformance: gradeConformance,
        damage_pct: 0.5,
        inspection_notes: "Legal Metrology Digital Quality Ingest & Settlement."
      });
      setInspectionSettlement(settlement);
      // Refresh contracts
      fetchContracts().then(data => setContracts(data));
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest">
              Direct Farmer-to-Institutional Sourcing
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              DIRECT PRODUCE MARKET
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Buy directly from verified FPOs and agricultural producers with complete landed cost transparency and legal metrology quality inspection SLAs.
            </p>
          </div>

          <DataProvenance source="Verified FPO Farmgate Listings" status="OBSERVED" />
        </div>

        {/* View Mode Tabs: Spot Marketplace vs Bulk RFQ Offtake Contracts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('MARKETPLACE')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'MARKETPLACE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Direct Spot Marketplace ({listings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CONTRACTS')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'CONTRACTS'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-700/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Guaranteed Bulk Offtake RFQs ({contracts.length})</span>
            </button>
          </div>

          {activeTab === 'CONTRACTS' && (
            <button
              onClick={() => {
                setShowCreateModal(true);
                setInspectionSettlement(null);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Institutional Offtake RFQ</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'MARKETPLACE' ? (
        <div className="space-y-6">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by produce, FPO name, or origin district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['ALL', 'VEGETABLES', 'CEREALS', 'PULSES'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Direct Produce Listings Grid */}
            <div className="lg:col-span-7 space-y-4">
              {loading ? (
                <CardSkeleton count={3} />
              ) : filteredListings.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-2 text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-bold text-white text-sm">No produce batches found matching your search</p>
                  <p>Try clearing filters or searching for Tomato, Onion, or Potato</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((item) => {
                    const isSelected = selectedListing?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedListing(item);
                          setOrderQuantity(item.quantity_kg);
                          setOrderConfirmed(false);
                        }}
                        className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-900/20'
                            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                              {item.category} • {item.grade}
                            </span>
                            <h3 className="font-black text-white text-base mt-1.5">{item.crop_name}</h3>
                            <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{item.fpo_name}</span>
                            </p>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-[10px] text-slate-400">Farmgate Price</span>
                            <div className="text-lg font-black text-emerald-400">₹{item.price_per_kg}/kg</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{item.location_name.split(',')[0]}</span>
                          </span>
                          <strong className="text-white">{item.quantity_kg.toLocaleString()} kg Available</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Landed Cost Calculator & Purchase Breakdown */}
            <div className="lg:col-span-5 space-y-4">
              {selectedListing ? (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>Landed Cost & Disintermediation Calculator</span>
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      VERIFIED FPO
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400">Selected Produce Batch:</span>
                      <div className="font-black text-white text-base mt-0.5">{selectedListing.crop_name}</div>
                      <p className="text-[11px] text-emerald-400">{selectedListing.fpo_name} • {selectedListing.location_name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Order Quantity (kg):</label>
                        <input
                          type="number"
                          value={orderQuantity}
                          onChange={(e) => setOrderQuantity(Number(e.target.value))}
                          max={selectedListing.quantity_kg}
                          min="100"
                          step="100"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Transit Distance (km):</label>
                        <input
                          type="number"
                          value={transitDistance}
                          onChange={(e) => setTransitDistance(Number(e.target.value))}
                          min="10"
                          max="2000"
                          step="10"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 font-mono"
                        />
                      </div>
                    </div>

                    {/* Landed Cost Itemization */}
                    {breakdown && (
                      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-300">
                          <span>1. Direct Farmer Farmgate Payout:</span>
                          <strong className="text-white">₹{selectedListing.price_per_kg.toFixed(2)}/kg</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>2. Haversine Freight Transport ({transitDistance} km):</span>
                          <span>+₹{breakdown.logistics_cost_per_kg.toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>3. Quality Assurance & Settlement Fee:</span>
                          <span>+₹{breakdown.platform_fee_per_kg.toFixed(2)}/kg</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
                          <span>Expected Landed Price:</span>
                          <span className="text-emerald-400">₹{breakdown.direct_consumer_price_per_kg.toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Urban Benchmark Retail Price:</span>
                          <span>₹{selectedListing.consumer_benchmark_price.toFixed(2)}/kg</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-[10px]">
                          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                            <span className="text-emerald-400 font-bold block">Buyer Savings</span>
                            <span className="text-white font-bold">{breakdown.consumer_savings_percent.toFixed(1)}%</span>
                          </div>
                          <div className="bg-cyan-950/40 border border-cyan-500/30 p-2 rounded-xl">
                            <span className="text-cyan-300 font-bold block">Farmer Uplift</span>
                            <span className="text-white font-bold">+{breakdown.farmer_earnings_uplift_percent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setOrderConfirmed(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-700/20 text-xs flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Confirm Direct Sourcing Order (₹{breakdown ? Math.round(breakdown.total_consumer_cost_direct).toLocaleString() : '...'})</span>
                    </button>

                    {orderConfirmed && (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs space-y-1 animate-fadeIn">
                        <div className="font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Direct Order Placed & Escrow Allocated!</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Dispatched order to {selectedListing.fpo_name}. Disintermediation savings of ₹{breakdown ? Math.round(breakdown.consumer_savings_amount).toLocaleString() : ''} secured.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-slate-500 text-xs">
                  Select a produce batch to calculate landed cost
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Contracts & Bulk Offtake Section */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((ctr) => (
              <div key={ctr.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      {ctr.buyer_type.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1">{ctr.commodity} Offtake Agreement</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{ctr.buyer_organization}</span>
                    </p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                    {ctr.status}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Volume:</span>
                    <strong className="text-white">{ctr.required_quantity_kg.toLocaleString()} kg ({ctr.required_quantity_kg / 1000} T)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guaranteed Price:</span>
                    <strong className="text-emerald-400">₹{ctr.offered_price_per_kg.toFixed(2)}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Hub:</span>
                    <span className="text-slate-300 truncate max-w-[160px]">{ctr.delivery_destination_hub}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-cyan-400 pt-1 border-t border-slate-800">
                    <span>Quality SLA:</span>
                    <span>Max Moisture {ctr.max_moisture_pct}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedContractForInspection(ctr);
                    setInspectionSettlement(null);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Inspect Quality & Settle</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Inspection & Payout Settlement Modal */}
      {selectedContractForInspection && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 max-w-lg w-full space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Legal Metrology Quality Inspection & Settlement</h3>
              </div>
              <button onClick={() => setSelectedContractForInspection(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleInspection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Delivered Moisture % (Limit: {selectedContractForInspection.max_moisture_pct}%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measuredMoisture}
                    onChange={(e) => setMeasuredMoisture(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Foreign Matter % (Limit: 1.0%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSettling}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/20 text-xs"
              >
                {isSettling ? 'Computing Settlement...' : 'Submit Quality Audit & Calculate Final Payout'}
              </button>

              {inspectionSettlement && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono animate-fadeIn">
                  <div className="flex justify-between items-center font-bold text-emerald-300">
                    <span>✓ Settlement Status: {inspectionSettlement.status}</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Disintermediation: ₹{inspectionSettlement.disintermediation_savings_vs_mandi_inr.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>Gross Value: <strong className="text-white">₹{inspectionSettlement.gross_payout_inr.toLocaleString()}</strong></div>
                    <div>Moisture Deduction: <strong className="text-rose-400">-₹{inspectionSettlement.quality_deductions_inr.toLocaleString()}</strong></div>
                    <div className="col-span-2 pt-1 border-t border-slate-800 text-emerald-400 font-bold text-xs flex justify-between">
                      <span>Final Net Payout to FPO:</span>
                      <span>₹{inspectionSettlement.net_fpo_payout_inr.toLocaleString()}</span>
                    </div>
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
