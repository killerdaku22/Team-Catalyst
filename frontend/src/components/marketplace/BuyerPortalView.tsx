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
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  FileText,
  PlusCircle,
  Building2,
  Scale,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import { DataProvenance } from '../ui/DataProvenance';

export const BuyerPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'CONTRACTS'>('MARKETPLACE');

  // Marketplace State
  const [listings, setListings] = useState<CropListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<CropListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Interactive Calculator State
  const [orderQuantity, setOrderQuantity] = useState<number>(1000);
  const [transitDistance, setTransitDistance] = useState<number>(120);
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
    ]).then(([listRes, contractsRes]) => {
      setListings(listRes);
      if (listRes.length > 0) {
        setSelectedListing(listRes[0]);
        setOrderQuantity(Math.min(1000, listRes[0].quantity_kg));
      }
      setContracts(contractsRes);
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
      )
        .then(setBreakdown)
        .catch(() => {});
    }
  }, [selectedListing, orderQuantity, transitDistance]);

  const filteredListings = listings.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory;
    const matchesSearch = item.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.fpo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectListing = (item: CropListing) => {
    setSelectedListing(item);
    setOrderQuantity(Math.min(orderQuantity, item.quantity_kg));
    setOrderConfirmed(false);
  };

  const handlePublishContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishingContract(true);
    try {
      const newContract = await createContract({
        buyer_org: buyerOrg,
        buyer_type: buyerType,
        commodity: contractCommodity,
        required_quantity_kg: contractQuantity,
        offered_price_per_kg: offeredPrice,
        delivery_location: deliveryHub,
        delivery_deadline: deliveryDeadline,
        quality_parameters: {
          max_moisture_pct: maxMoisture,
          foreign_matter_max_pct: 1.5,
          acceptable_grades: ["A", "B"]
        }
      });
      setContracts([newContract, ...contracts]);
      setShowCreateModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishingContract(false);
    }
  };

  const handleRunInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForInspection) return;
    setIsSettling(true);
    try {
      const res = await inspectAndSettleContract(selectedContractForInspection.id, {
        inspector_id: "INSP-WDRA-904",
        measured_moisture_pct: measuredMoisture,
        measured_foreign_matter_pct: foreignMatter,
        grade_conformance: gradeConformance,
        delivered_quantity_kg: selectedContractForInspection.required_quantity_kg
      });
      setInspectionSettlement(res);
      const updatedContracts = await fetchContracts();
      setContracts(updatedContracts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header: Commerce Identity & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B3731]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">Institutional Procurement</span>
            <DataProvenance source="Verified FPO Registry & Legal Metrology" status="LIVE" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Direct Produce Marketplace
          </h1>
          <p className="text-xs text-[#8E9C93]">
            Source produce directly from verified producer cooperatives with transparent landed cost math and zero broker cess.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 bg-[#121815] p-1 rounded-lg border border-[#2B3731] shrink-0">
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'MARKETPLACE'
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#C2CBC5] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Direct Spot Lots</span>
          </button>
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'CONTRACTS'
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#C2CBC5] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Forward RFQ Contracts</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: DIRECT SPOT MARKETPLACE (Split 7 / 5 Layout)
          ============================================================ */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1A221E] border border-[#2B3731] p-3 rounded-xl">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8E9C93]" />
              <input
                type="text"
                placeholder="Search crop, FPO, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ad-input h-8 pl-8 text-xs w-full"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['ALL', 'VEGETABLES', 'CEREALS', 'FRUITS', 'PULSES'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[#121815] text-[#8E9C93] hover:text-white border border-[#1F2723]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Split View: Left Listings (7 Cols) | Right Stable Order Workspace (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Produce Listings Catalogue */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between px-1 text-xs text-[#8E9C93]">
                <span>Available Verified Batches ({filteredListings.length})</span>
                <span>Click item to configure landed order</span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-8 text-center text-xs text-[#8E9C93]">
                  No produce lots match your search query. Try resetting filters.
                </div>
              ) : (
                filteredListings.map((item) => {
                  const isSelected = selectedListing?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectListing(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#222C27] border-[#2D6A4F] ring-1 ring-[#2D6A4F]/50 shadow-md'
                          : 'bg-[#1A221E] border-[#2B3731] hover:border-[#3D4D45] hover:bg-[#1C2420]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-white tracking-tight">{item.crop_name}</h3>
                            <span className="ad-badge ad-badge-sage text-[10px]">{item.grade}</span>
                            <span className="text-[10px] text-[#8E9C93]">• {item.shelf_life_days}d Shelf Life</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-[#C2CBC5]">
                            <Building2 className="w-3.5 h-3.5 text-[#52796F] shrink-0" />
                            <span className="font-semibold">{item.fpo_name}</span>
                            <span className="text-[#8E9C93]">({item.location_name})</span>
                          </div>
                        </div>

                        {/* Price & Quantity Tag */}
                        <div className="text-right shrink-0">
                          <strong className="text-base font-extrabold text-[#48BB78] block">
                            ₹{item.price_per_kg.toFixed(2)}
                            <span className="text-xs text-[#8E9C93] font-normal">/kg</span>
                          </strong>
                          <span className="text-[11px] text-[#C2CBC5] font-mono">
                            {item.quantity_kg.toLocaleString()} kg available
                          </span>
                        </div>
                      </div>

                      {/* Bottom Micro Comparison Row */}
                      <div className="mt-2.5 pt-2 border-t border-[#2B3731]/60 flex items-center justify-between text-[11px] text-[#8E9C93]">
                        <div>
                          <span>Retail Mandi: </span>
                          <span className="line-through text-[#8E9C93]">₹{item.consumer_benchmark_price.toFixed(2)}/kg</span>
                          <span className="text-[#48BB78] font-semibold ml-1.5">
                            (-{Math.round(((item.consumer_benchmark_price - item.price_per_kg) / item.consumer_benchmark_price) * 100)}% Direct Sourcing Advantage)
                          </span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#48BB78] translate-x-1' : 'text-[#8E9C93]'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Sticky Selected Order & Landed Cost Breakdown Workspace */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              {selectedListing ? (
                <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-5 space-y-4 shadow-xl">
                  {/* Workspace Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#2B3731]">
                    <div>
                      <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">Order Workspace</span>
                      <h2 className="text-base font-bold text-white tracking-tight">{selectedListing.crop_name}</h2>
                    </div>
                    <span className="ad-badge ad-badge-success text-xs font-bold">
                      {selectedListing.grade}
                    </span>
                  </div>

                  {/* Lot Metadata Snapshot */}
                  <div className="bg-[#121815] p-3 rounded-lg border border-[#1F2723] space-y-1.5 text-xs text-[#C2CBC5]">
                    <div className="flex justify-between">
                      <span className="text-[#8E9C93]">Producer FPO:</span>
                      <strong className="text-white">{selectedListing.fpo_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9C93]">Origin Location:</span>
                      <span>{selectedListing.location_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9C93]">Harvest Date:</span>
                      <span>{selectedListing.harvest_date}</span>
                    </div>
                  </div>

                  {/* Quantity & Distance Sliders */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <label className="font-semibold text-white">Order Quantity (kg)</label>
                        <span className="font-mono text-[#48BB78] font-bold">{orderQuantity.toLocaleString()} kg</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={selectedListing.quantity_kg}
                        step={100}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#121815] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
                      />
                      <div className="flex justify-between text-[10px] text-[#8E9C93] mt-1">
                        <span>Min: 100 kg</span>
                        <span>Lot Total: {selectedListing.quantity_kg.toLocaleString()} kg</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <label className="font-semibold text-white">Transit Distance (km)</label>
                        <span className="font-mono text-[#C2CBC5] font-bold">{transitDistance} km</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={800}
                        step={10}
                        value={transitDistance}
                        onChange={(e) => setTransitDistance(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#121815] rounded-lg appearance-none cursor-pointer accent-[#52796F]"
                      />
                    </div>
                  </div>

                  {/* Deductive Landed Cost Itemization */}
                  {breakdown && (
                    <div className="space-y-2 pt-2 border-t border-[#2B3731]">
                      <span className="text-[10px] font-bold text-[#8E9C93] uppercase tracking-wider block">
                        Landed Cost Calculation
                      </span>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>Farmgate Produce Amount:</span>
                          <span className="font-mono">₹{breakdown.total_farmer_payout_direct.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>Refrigerated Freight ({transitDistance} km):</span>
                          <span className="font-mono text-[#8E9C93]">₹{(breakdown.logistics_cost_per_kg * orderQuantity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>Legal Metrology & Assay Fee:</span>
                          <span className="font-mono text-[#8E9C93]">₹{(breakdown.platform_fee_per_kg * orderQuantity).toLocaleString()}</span>
                        </div>

                        {/* Total Landed Cost */}
                        <div className="pt-2 border-t border-[#2B3731] flex items-baseline justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">Total Landed Price</span>
                            <span className="text-[10px] text-[#52796F]">₹{breakdown.direct_consumer_price_per_kg.toFixed(2)}/kg delivered</span>
                          </div>
                          <strong className="text-xl font-black text-white font-mono">
                            ₹{breakdown.total_consumer_cost_direct.toLocaleString()}
                          </strong>
                        </div>

                        {/* Direct Mutual Value Realization Box */}
                        <div className="bg-[#222C27] border border-[#2D6A4F]/40 p-3 rounded-lg space-y-1 mt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#52796F] font-semibold">Your Net Procurement Savings:</span>
                            <strong className="text-[#48BB78] font-mono">
                              ₹{breakdown.consumer_savings_amount.toLocaleString()} ({Math.round(breakdown.consumer_savings_percent)}%)
                            </strong>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#C2CBC5]">
                            <span>Farmer Net Uplift:</span>
                            <span className="text-[#48BB78] font-semibold font-mono">
                              +₹{breakdown.farmer_earnings_uplift_amount.toLocaleString()} (+{Math.round(breakdown.farmer_earnings_uplift_percent)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Actions */}
                  <div className="pt-1">
                    {orderConfirmed ? (
                      <div className="bg-[#121815] border border-[#2D6A4F] p-3 rounded-lg text-center space-y-1">
                        <CheckCircle2 className="w-5 h-5 text-[#48BB78] mx-auto" />
                        <span className="text-xs font-bold text-white block">Procurement Intent Locked</span>
                        <span className="text-[10px] text-[#8E9C93] block">Contract drafted with WDRA inspection dispatch.</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOrderConfirmed(true)}
                        className="ad-btn-primary w-full text-xs font-bold py-2.5 shadow-lg"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Confirm Direct Purchase Intent</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl p-8 text-center text-xs text-[#8E9C93]">
                  Select a produce lot from the catalogue to configure and price your order.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: FORWARD RFQ CONTRACTS & QUALITY INSPECTION
          ============================================================ */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1A221E] border border-[#2B3731] p-4 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white">Forward Procurement RFQ Contracts</h2>
              <p className="text-xs text-[#8E9C93]">
                Post binding institutional purchase contracts with moisture and grade specifications.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="ad-btn-primary text-xs shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Forward RFQ</span>
            </button>
          </div>

          {/* Contracts Table */}
          <div className="bg-[#1A221E] border border-[#2B3731] rounded-xl overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Buyer Organization</th>
                  <th>Commodity</th>
                  <th>Target Qty</th>
                  <th>Offered Price</th>
                  <th>Committed FPO</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-white text-xs">{c.id}</td>
                    <td>{c.buyer_organization}</td>
                    <td className="font-semibold text-white">{c.commodity}</td>
                    <td>{c.required_quantity_kg.toLocaleString()} kg</td>
                    <td className="font-bold text-[#48BB78]">₹{c.offered_price_per_kg.toFixed(2)}/kg</td>
                    <td>{c.assigned_fpo_id ? `FPO #${c.assigned_fpo_id}` : 'Awaiting Commitment'}</td>
                    <td>
                      <span className={`ad-badge ${
                        c.status === 'SETTLED' ? 'ad-badge-success' :
                        c.status === 'FPO_COMMITTED' ? 'ad-badge-warning' : 'ad-badge-sage'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedContractForInspection(c)}
                        className="ad-btn-secondary text-[11px] h-7 px-2.5"
                      >
                        Inspect / Settle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quality Inspection Drawer Modal */}
          {selectedContractForInspection && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#1A221E] border border-[#2B3731] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#2B3731]">
                  <div>
                    <span className="text-[10px] font-bold text-[#52796F] uppercase">Legal Metrology Audit</span>
                    <h3 className="text-base font-bold text-white">Quality Inspection & Settlement</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedContractForInspection(null);
                      setInspectionSettlement(null);
                    }}
                    className="text-[#8E9C93] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleRunInspection} className="space-y-3">
                  <div>
                    <label className="ad-label">Measured Moisture Content (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={measuredMoisture}
                      onChange={(e) => setMeasuredMoisture(Number(e.target.value))}
                      className="ad-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="ad-label">Foreign Matter & Refraction (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={foreignMatter}
                      onChange={(e) => setForeignMatter(Number(e.target.value))}
                      className="ad-input"
                      required
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-[#C2CBC5]">
                      <input
                        type="checkbox"
                        checked={gradeConformance}
                        onChange={(e) => setGradeConformance(e.target.checked)}
                        className="rounded border-[#2B3731] bg-[#121815] text-[#2D6A4F] focus:ring-0"
                      />
                      <span>Grade Conformance Verified by WDRA Field Assayer</span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedContractForInspection(null)}
                      className="ad-btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSettling}
                      className="ad-btn-primary text-xs font-bold"
                    >
                      {isSettling ? 'Computing Settlement...' : 'Submit Inspection & Release Payout'}
                    </button>
                  </div>
                </form>

                {inspectionSettlement && (
                  <div className="bg-[#121815] border border-[#2D6A4F] p-4 rounded-xl space-y-2 mt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#48BB78]">Settlement Result: {inspectionSettlement.status}</span>
                      <span className="font-mono text-white text-[11px]">Contract: {inspectionSettlement.contract_id}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#C2CBC5]">
                      <span>Final Net Payout Released to FPO:</span>
                      <strong className="text-white font-mono">₹{inspectionSettlement.net_fpo_payout_inr.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Forward RFQ Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#1A221E] border border-[#2B3731] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#2B3731]">
                  <h3 className="text-base font-bold text-white">Create Forward Procurement Contract</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-[#8E9C93] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handlePublishContract} className="space-y-3">
                  <div>
                    <label className="ad-label">Buyer Entity Name</label>
                    <input
                      type="text"
                      value={buyerOrg}
                      onChange={(e) => setBuyerOrg(e.target.value)}
                      className="ad-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ad-label">Commodity</label>
                      <input
                        type="text"
                        value={contractCommodity}
                        onChange={(e) => setContractCommodity(e.target.value)}
                        className="ad-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="ad-label">Target Quantity (kg)</label>
                      <input
                        type="number"
                        value={contractQuantity}
                        onChange={(e) => setContractQuantity(Number(e.target.value))}
                        className="ad-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ad-label">Offered Ask Price (₹/kg)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(Number(e.target.value))}
                        className="ad-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="ad-label">Delivery Deadline</label>
                      <input
                        type="date"
                        value={deliveryDeadline}
                        onChange={(e) => setDeliveryDeadline(e.target.value)}
                        className="ad-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="ad-btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishingContract}
                      className="ad-btn-primary text-xs font-bold"
                    >
                      {isPublishingContract ? 'Publishing...' : 'Publish Contract to Board'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
