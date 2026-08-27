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
  Layers
} from 'lucide-react';

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
    const matchesSearch = item.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) || item.fpo_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const handlePlaceOrder = () => {
    setOrderConfirmed(true);
    setTimeout(() => setOrderConfirmed(false), 4000);
  };

  const handleCreateContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishingContract(true);
    try {
      const newContract = await createContract({
        buyer_organization: buyerOrg,
        buyer_type: buyerType,
        commodity: contractCommodity,
        required_quantity_kg: contractQuantity,
        offered_price_per_kg: offeredPrice,
        delivery_destination_hub: deliveryHub,
        destination_latitude: 28.3512,
        destination_longitude: 76.9415,
        delivery_deadline: deliveryDeadline,
        max_moisture_pct: maxMoisture
      });
      setContracts([newContract, ...contracts]);
      setShowCreateModal(false);
    } finally {
      setIsPublishingContract(false);
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForInspection) return;
    setIsSettling(true);
    try {
      const res = await inspectAndSettleContract(selectedContractForInspection.id, {
        contract_id: selectedContractForInspection.id,
        measured_moisture_pct: measuredMoisture,
        grade_conformance: gradeConformance,
        foreign_matter_pct: foreignMatter,
        damage_pct: 0.2,
        inspector_id: "INSP-007",
        inspection_notes: "Legal metrology & quality grade certified."
      });
      setInspectionSettlement(res);
      // Update contract status in local list
      setContracts(contracts.map(c => c.id === selectedContractForInspection.id ? { ...c, status: 'SETTLED', settlement: res } : c));
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
            Institutional Buyer & Retail Sourcing Hub
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Direct FPO Marketplace & Guaranteed Offtake</h1>
          <p className="text-xs text-slate-300 mt-1">
            Eliminate commission intermediaries. Buy direct from verified Indian Farmer Producer Organizations with transparent metrology.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
              activeTab === 'MARKETPLACE'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Direct Spot Marketplace</span>
          </button>
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
              activeTab === 'CONTRACTS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bulk Procurement Contracts ({contracts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SPOT MARKETPLACE */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search produce or FPO cluster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {['ALL', 'VEGETABLES', 'CEREALS', 'FRUITS', 'PULSES'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produce Cards List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map(listing => {
                  const isSelected = selectedListing?.id === listing.id;
                  return (
                    <div
                      key={listing.id}
                      onClick={() => {
                        setSelectedListing(listing);
                        setOrderQuantity(listing.quantity_kg);
                      }}
                      className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                            {listing.category}
                          </span>
                          <h3 className="font-extrabold text-white text-base mt-1">{listing.crop_name}</h3>
                          <p className="text-xs text-emerald-400 font-medium">{listing.fpo_name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-white">₹{listing.price_per_kg}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">/ kg</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>Available: <strong className="text-white">{listing.quantity_kg.toLocaleString()} kg</strong></div>
                        <div>Grade: <strong className="text-white">{listing.grade}</strong></div>
                        <div className="col-span-2 flex items-center space-x-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{listing.location_name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FairPrice Breakdown & Checkout Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>FairPrice Disintermediation Engine</span>
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  LIVE CALC
                </span>
              </div>

              {selectedListing && breakdown ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400">Selected Produce:</span>
                    <div className="font-bold text-white text-sm">{selectedListing.crop_name}</div>
                    <div className="text-[11px] text-emerald-400">{selectedListing.fpo_name}</div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Order Quantity (Kilograms):</label>
                    <input
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.min(selectedListing.quantity_kg, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      max={selectedListing.quantity_kg}
                      min="100"
                    />
                  </div>

                  {/* Price Waterfall Breakdown */}
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Farmer Direct Payout:</span>
                      <strong>₹{breakdown.farmer_price_per_kg}/kg</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Logistics Freight Cost:</span>
                      <span>+₹{breakdown.logistics_cost_per_kg}/kg</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Platform Assurance Fee (1.5%):</span>
                      <span>+₹{breakdown.platform_fee_per_kg}/kg</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400 text-xs">
                      <span>Direct Landed Price:</span>
                      <span>₹{breakdown.direct_consumer_price_per_kg}/kg</span>
                    </div>
                  </div>

                  {/* Savings Comparison vs Middleman */}
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1">
                    <div className="flex justify-between text-cyan-300 font-semibold">
                      <span>Consumer Retail Benchmark:</span>
                      <span>₹{breakdown.consumer_benchmark_retail_price_per_kg}/kg</span>
                    </div>
                    <div className="flex justify-between text-cyan-400 font-bold text-xs pt-1">
                      <span>Your Total Procurement Savings:</span>
                      <span>-₹{breakdown.consumer_savings_amount.toLocaleString()} ({breakdown.consumer_savings_percent}%)</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Confirm Direct Procurement Order (₹{breakdown.total_consumer_cost_direct.toLocaleString()})</span>
                  </button>

                  {orderConfirmed && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-center font-bold text-xs animate-bounce">
                      ✓ Direct FPO Purchase Order Confirmed & Dispatched to Logistics Queue!
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">Select a produce batch to calculate FairPrice breakdown</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTITUTIONAL CONTRACTS */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between glass-panel p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Guaranteed-Offtake Institutional Procurement Agreements</h2>
              <p className="text-xs text-slate-400">
                Lock in seasonal supply with verified FPO cooperatives under standardized legal metrology and quality inspection SLAs.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Bulk Procurement RFQ</span>
            </button>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contracts.map(contract => (
              <div key={contract.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                      {contract.id}
                    </span>
                    <h3 className="font-extrabold text-white text-base mt-1">{contract.commodity}</h3>
                    <p className="text-xs text-blue-400 font-semibold">{contract.buyer_organization}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    contract.status === 'SETTLED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : contract.status === 'FPO_COMMITTED'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {contract.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Required Quantity:</span>
                    <strong>{contract.required_quantity_kg.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guaranteed Offer Price:</span>
                    <strong className="text-emerald-400 font-mono">₹{contract.offered_price_per_kg}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Moisture Limit:</span>
                    <span>{contract.max_moisture_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Deadline:</span>
                    <span>{contract.delivery_deadline}</span>
                  </div>
                </div>

                {contract.assigned_fpo_name && (
                  <div className="p-2 bg-blue-950/20 border border-blue-500/30 rounded-lg text-[11px] text-blue-300">
                    Committed FPO: <strong>{contract.assigned_fpo_name}</strong>
                  </div>
                )}

                {contract.settlement && (
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-emerald-300">
                      <span>Settled Payout:</span>
                      <span>₹{contract.settlement.net_fpo_payout_inr.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Disintermediation Savings: ₹{contract.settlement.disintermediation_savings_vs_mandi_inr.toLocaleString()} vs Mandi
                    </div>
                  </div>
                )}

                {contract.status === 'OPEN_FOR_BIDDING' && (
                  <button
                    onClick={() => {
                      setSelectedContractForInspection(contract);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center space-x-1"
                  >
                    <span>Inspect Quality & Settle</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quality Inspection Modal */}
          {selectedContractForInspection && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">
                    Quality Inspection & Legal Metrology Settlement
                  </h3>
                  <button
                    onClick={() => setSelectedContractForInspection(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Contract ID</label>
                    <input
                      type="text"
                      disabled
                      value={selectedContractForInspection.id}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-400 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Measured Moisture (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measuredMoisture}
                        onChange={(e) => setMeasuredMoisture(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Foreign Matter (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={foreignMatter}
                        onChange={(e) => setForeignMatter(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="conformance"
                      checked={gradeConformance}
                      onChange={(e) => setGradeConformance(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="conformance" className="text-slate-300">
                      Visual Grade Meets Certified Legal Metrology Standard (Grade A)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSettling}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {isSettling ? 'Generating Settlement...' : 'Submit Certified Inspection & Trigger Payout'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Create Contract Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">
                    Publish Guaranteed Institutional Purchase RFQ
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateContractSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Buyer Organization</label>
                    <input
                      type="text"
                      value={buyerOrg}
                      onChange={(e) => setBuyerOrg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Commodity</label>
                      <input
                        type="text"
                        value={contractCommodity}
                        onChange={(e) => setContractCommodity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Required Quantity (kg)</label>
                      <input
                        type="number"
                        value={contractQuantity}
                        onChange={(e) => setContractQuantity(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Offered Price (₹ / kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded-lg p-2 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Max Moisture Limit (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={maxMoisture}
                        onChange={(e) => setMaxMoisture(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Delivery Destination Hub</label>
                    <input
                      type="text"
                      value={deliveryHub}
                      onChange={(e) => setDeliveryHub(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Delivery Deadline</label>
                    <input
                      type="date"
                      value={deliveryDeadline}
                      onChange={(e) => setDeliveryDeadline(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishingContract}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                  >
                    {isPublishingContract ? 'Publishing RFQ...' : 'Publish Contract to FPO Network'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
