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
  DollarSign,
  Package,
  Award,
  Truck,
  Check
} from 'lucide-react';
import { DataProvenance } from '../ui/DataProvenance';

const CROP_IMAGES: Record<string, string> = {
  'Tomato': '/assets/agridirect-farmer-harvest.webp.png',
  'Onion': '/assets/agridirect-fpo-collection.webp.png',
  'Potato': '/assets/agridirect-market-arrival.webp.png',
  'Wheat': '/assets/agridirect-farm-hero.webp.png',
};

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

  const getImageForCrop = (cropName: string) => {
    for (const key of Object.keys(CROP_IMAGES)) {
      if (cropName.toLowerCase().includes(key.toLowerCase())) {
        return CROP_IMAGES[key];
      }
    }
    return '/assets/agridirect-farmer-harvest.webp.png';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Editorial Identity Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#26332C]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">
              Verified Producer Sourcing Network
            </span>
            <DataProvenance source="Direct FPO Registry & APMC Gate Telemetry" status="LIVE" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Direct Produce Marketplace
          </h1>
          <p className="text-xs text-[#8E9C93] max-w-2xl mt-0.5">
            Institutional buyers procure farmgate-graded produce directly from cooperative aggregators with guaranteed legal metrology and zero broker deductions.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#121815] p-1 rounded-xl border border-[#26332C] shrink-0 self-start lg:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'MARKETPLACE'
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'text-[#8E9C93] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Spot Produce Lots</span>
          </button>
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'CONTRACTS'
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'text-[#8E9C93] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Institutional RFQ Contracts</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: DIRECT SPOT MARKETPLACE (Split 7 / 5 Layout)
          ============================================================ */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-4">
          {/* Top Filter & Sourcing Metrics Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-[#161E1A] border border-[#26332C] p-3 rounded-2xl shadow-sm">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#52796F]" />
              <input
                type="text"
                placeholder="Search commodity, producer FPO, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101513] border border-[#26332C] rounded-xl pl-10 pr-3 py-1.5 text-xs text-white placeholder-[#637068] focus:border-[#2D6A4F] focus:outline-none transition-colors"
              />
            </div>

            {/* Category Chips */}
            <div className="lg:col-span-8 flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 justify-start lg:justify-end">
              {['ALL', 'VEGETABLES', 'CEREALS', 'FRUITS', 'PULSES'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#2D6A4F] text-white shadow-sm'
                      : 'bg-[#101513] text-[#8E9C93] hover:text-white border border-[#26332C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main Sourcing Workspace: Left Catalogue (7 Cols) | Right Stable Invoice Panel (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Produce Catalogue */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1 text-xs text-[#8E9C93]">
                <span className="font-semibold text-[#C2CBC5]">
                  Verified Lots Ready for Procurement ({filteredListings.length})
                </span>
                <span className="text-[11px]">Click lot to inspect landed cost</span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-10 text-center text-xs text-[#8E9C93]">
                  No harvest lots match your filter criteria. Try searching another commodity.
                </div>
              ) : (
                filteredListings.map((item) => {
                  const isSelected = selectedListing?.id === item.id;
                  const discountPct = Math.round(((item.consumer_benchmark_price - item.price_per_kg) / item.consumer_benchmark_price) * 100);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectListing(item)}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-[#1D2722] border-[#2D6A4F] ring-1 ring-[#2D6A4F] shadow-lg'
                          : 'bg-[#161E1A] border-[#26332C] hover:border-[#384A41] hover:bg-[#1A221E]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Thumbnail Image */}
                        <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-[#101513] border border-[#26332C] shrink-0 relative">
                          <img
                            src={getImageForCrop(item.crop_name)}
                            alt={item.crop_name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-[#121815]/90 border border-[#26332C] text-[#48BB78] px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {item.grade}
                          </div>
                        </div>

                        {/* Middle Details */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-white tracking-tight">
                              {item.crop_name}
                            </h3>
                            <span className="text-[10px] text-[#52796F] font-mono">• {item.shelf_life_days}d Shelf Life</span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-[#C2CBC5]">
                            <Building2 className="w-3.5 h-3.5 text-[#52796F] shrink-0" />
                            <span className="font-semibold text-white">{item.fpo_name}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-[11px] text-[#8E9C93]">
                            <MapPin className="w-3 h-3 text-[#52796F] shrink-0" />
                            <span>{item.location_name}</span>
                          </div>

                          {/* Sourcing Realization Advantage */}
                          <div className="pt-1.5 flex items-center space-x-2 text-[11px]">
                            <span className="text-[#8E9C93]">Mandi Benchmark:</span>
                            <span className="line-through text-[#637068]">₹{item.consumer_benchmark_price.toFixed(2)}/kg</span>
                            <span className="text-[#48BB78] font-bold bg-[#222C27] px-1.5 py-0.5 rounded border border-[#2B3731]">
                              -{discountPct}% Direct Sourcing Advantage
                            </span>
                          </div>
                        </div>

                        {/* Right Price & Quantity */}
                        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-[#26332C] pt-2 sm:pt-0">
                          <strong className="text-xl font-black text-[#48BB78] block font-mono">
                            ₹{item.price_per_kg.toFixed(2)}
                            <span className="text-xs text-[#8E9C93] font-normal">/kg</span>
                          </strong>
                          <span className="text-xs text-white font-mono block mt-0.5">
                            {item.quantity_kg.toLocaleString()} kg batch
                          </span>
                          <span className="text-[10px] text-[#52796F] block mt-1">
                            Harvested {item.harvest_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Sticky Selected Order Workspace & Landed Cost Breakdown */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              {selectedListing ? (
                <div className="bg-[#161E1A] border-2 border-[#2D6A4F]/60 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
                  
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#26332C]">
                    <div>
                      <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">
                        Procurement Order Workspace
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                        {selectedListing.crop_name}
                      </h2>
                    </div>
                    <span className="ad-badge ad-badge-success text-xs font-bold px-2 py-0.5">
                      {selectedListing.grade} Certified
                    </span>
                  </div>

                  {/* FPO Batch Provenance */}
                  <div className="bg-[#101513] p-3.5 rounded-xl border border-[#26332C] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E9C93]">Verified Producer FPO:</span>
                      <strong className="text-white font-semibold">{selectedListing.fpo_name}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E9C93]">Collection Center:</span>
                      <span className="text-[#C2CBC5]">{selectedListing.location_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E9C93]">Farmgate Batch Available:</span>
                      <span className="font-mono text-[#48BB78] font-bold">{selectedListing.quantity_kg.toLocaleString()} kg</span>
                    </div>
                  </div>

                  {/* Interactive Sliders */}
                  <div className="space-y-4">
                    {/* Quantity Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <label className="font-bold text-white">Procurement Volume</label>
                        <span className="font-mono text-[#48BB78] font-black text-sm bg-[#101513] px-2 py-0.5 rounded border border-[#26332C]">
                          {orderQuantity.toLocaleString()} kg
                        </span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={selectedListing.quantity_kg}
                        step={100}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Number(e.target.value))}
                        className="w-full h-2 bg-[#101513] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
                      />
                      <div className="flex justify-between text-[10px] text-[#8E9C93] mt-1">
                        <span>Min: 100 kg</span>
                        <span>Cooperative Max: {selectedListing.quantity_kg.toLocaleString()} kg</span>
                      </div>
                    </div>

                    {/* Distance Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <label className="font-bold text-white">Transit Distance to Destination Hub</label>
                        <span className="font-mono text-[#C2CBC5] font-bold text-xs bg-[#101513] px-2 py-0.5 rounded border border-[#26332C]">
                          {transitDistance} km
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={800}
                        step={10}
                        value={transitDistance}
                        onChange={(e) => setTransitDistance(Number(e.target.value))}
                        className="w-full h-2 bg-[#101513] rounded-lg appearance-none cursor-pointer accent-[#52796F]"
                      />
                    </div>
                  </div>

                  {/* Itemized Deductive Landed Cost Matrix */}
                  {breakdown && (
                    <div className="space-y-2.5 pt-3 border-t border-[#26332C]">
                      <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider block">
                        Itemized Landed Cost Structure
                      </span>

                      <div className="bg-[#101513] p-3.5 rounded-xl border border-[#26332C] space-y-2 text-xs">
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>1. Farmgate Produce Net:</span>
                          <span className="font-mono text-white">₹{breakdown.total_farmer_payout_direct.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>2. Cold-Chain Freight ({transitDistance} km):</span>
                          <span className="font-mono text-[#8E9C93]">+₹{(breakdown.logistics_cost_per_kg * orderQuantity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#C2CBC5]">
                          <span>3. WDRA Metrology & Assay:</span>
                          <span className="font-mono text-[#8E9C93]">+₹{(breakdown.platform_fee_per_kg * orderQuantity).toLocaleString()}</span>
                        </div>

                        {/* Total Landed Price */}
                        <div className="pt-2.5 border-t border-[#26332C] flex items-baseline justify-between">
                          <div>
                            <strong className="text-sm font-bold text-white block">Total Landed Cost</strong>
                            <span className="text-[11px] text-[#48BB78] font-mono">
                              ₹{breakdown.direct_consumer_price_per_kg.toFixed(2)}/kg delivered
                            </span>
                          </div>
                          <strong className="text-2xl font-black text-white font-mono">
                            ₹{breakdown.total_consumer_cost_direct.toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      {/* Mutual Value Realization Box */}
                      <div className="bg-[#1D2722] border border-[#2D6A4F]/50 p-3.5 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-[#52796F] font-bold">Buyer Direct Procurement Savings:</span>
                          <strong className="text-[#48BB78] font-mono text-sm font-bold">
                            ₹{breakdown.consumer_savings_amount.toLocaleString()} ({Math.round(breakdown.consumer_savings_percent)}%)
                          </strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#C2CBC5]">
                          <span>Producer FPO Net Uplift:</span>
                          <span className="text-[#48BB78] font-semibold font-mono">
                            +₹{breakdown.farmer_earnings_uplift_amount.toLocaleString()} (+{Math.round(breakdown.farmer_earnings_uplift_percent)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Order Action Button */}
                  <div>
                    {orderConfirmed ? (
                      <div className="bg-[#1D2722] border-2 border-[#2D6A4F] p-4 rounded-xl text-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-[#48BB78] mx-auto" />
                        <strong className="text-sm font-bold text-white block">Purchase Intent Confirmed</strong>
                        <span className="text-xs text-[#8E9C93] block">
                          Contract generated. Scheduled for WDRA farmgate inspection & cold-chain pickup.
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOrderConfirmed(true)}
                        className="ad-btn-primary w-full text-xs font-bold py-3 shadow-xl flex items-center justify-center space-x-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Confirm Direct Purchase Intent</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-10 text-center text-xs text-[#8E9C93]">
                  Select a produce lot from the catalogue to configure your order.
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161E1A] border border-[#26332C] p-4 rounded-2xl">
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
          <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl overflow-x-auto">
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
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#26332C]">
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
                        className="rounded border-[#26332C] bg-[#101513] text-[#2D6A4F] focus:ring-0"
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
                  <div className="bg-[#101513] border border-[#2D6A4F] p-4 rounded-xl space-y-2 mt-3">
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
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#26332C]">
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
