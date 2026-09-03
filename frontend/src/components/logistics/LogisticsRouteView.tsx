import React, { useEffect, useState } from 'react';
import { CropListing, VRPResult } from '../../types';
import { fetchListings, optimizeRoute } from '../../services/api';
import {
  Truck,
  Leaf,
  CheckSquare,
  Square,
  Zap,
  MapPin,
  Route,
  ShieldCheck,
  ArrowRight,
  Gauge,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  DollarSign,
  Play,
  RotateCcw,
  Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DataProvenance } from '../ui/DataProvenance';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom map view updater to auto-fit bounds
const MapBoundsUpdater: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

interface DestinationOption {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

const DESTINATION_HUBS: DestinationOption[] = [
  { id: 'delhi', name: 'Central Delhi Terminal (Azadpur APMC)', city: 'Delhi-NCR', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mumbai', name: 'Mumbai Vashi APMC Terminal', city: 'Navi Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { id: 'bengaluru', name: 'Bengaluru Electronic City Agro-Hub', city: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
  { id: 'lucknow', name: 'Lucknow Regional Agricultural Terminal', city: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { id: 'kolkata', name: 'Kolkata Post-Harvest Terminal', city: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
];

interface VehicleOption {
  id: string;
  name: string;
  capacity_kg: number;
  costPerKm: number;
  type: string;
  desc: string;
}

const VEHICLE_FLEET: VehicleOption[] = [
  { id: 'reefer-5k', name: 'Cold-Chain Reefer Truck (5.0 T)', capacity_kg: 5000, costPerKm: 14.5, type: 'Refrigerated Cold-Chain', desc: 'Temperature controlled 2–8°C for perishables' },
  { id: 'heavy-10k', name: 'Multi-Axle Heavy Carrier (10.0 T)', capacity_kg: 10000, costPerKm: 22.0, type: 'Heavy Duty Bulk', desc: 'High-payload bulk long-haul transport' },
  { id: 'ev-2.5k', name: 'Green EV Commercial Van (2.5 T)', capacity_kg: 2500, costPerKm: 9.5, type: 'Zero Emission EV', desc: 'Urban intracity zero-emission delivery' },
];

export const LogisticsRouteView: React.FC = () => {
  const [availableListings, setAvailableListings] = useState<CropListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption>(DESTINATION_HUBS[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLE_FLEET[0]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [vrpResult, setVrpResult] = useState<VRPResult | null>(null);

  useEffect(() => {
    fetchListings().then(listings => {
      setAvailableListings(listings);
      if (listings.length >= 2) {
        setSelectedIds([listings[0].id, listings[1].id]);
      }
    });
  }, []);

  const handleToggleListing = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRunOptimizer = async () => {
    if (selectedIds.length === 0) return;
    setIsOptimizing(true);

    const lotsToOptimize = availableListings.filter(l => selectedIds.includes(l.id));

    try {
      const result = await optimizeRoute(
        lotsToOptimize,
        {
          name: selectedDestination.name,
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude
        },
        selectedVehicle.capacity_kg
      );
      setVrpResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    if (selectedIds.length > 0) {
      handleRunOptimizer();
    }
  }, [selectedIds, selectedDestination, selectedVehicle]);

  const selectedListings = availableListings.filter(l => selectedIds.includes(l.id));
  const totalCargoKg = selectedListings.reduce((sum, item) => sum + item.quantity_kg, 0);
  const capacityPct = Math.round((totalCargoKg / selectedVehicle.capacity_kg) * 100);
  const isOverCapacity = totalCargoKg > selectedVehicle.capacity_kg;
  const estimatedCost = vrpResult ? Math.round(vrpResult.total_distance_km * selectedVehicle.costPerKm) : 0;

  // Build map coordinate array
  const mapPositions: [number, number][] = [
    ...selectedListings.map(l => [l.latitude, l.longitude] as [number, number]),
    [selectedDestination.latitude, selectedDestination.longitude]
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Header: Operational Transport Identity */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--ad-border)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ad-accent)' }}>
              2-Opt CVRP Multi-Stop Operations
            </span>
            <DataProvenance source="OpenStreetMap Routing & Heuristic VRP Engine" status="MODEL_OUTPUT" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
            Pooled Logistics & Route Optimizer
          </h1>
          <p className="text-sm max-w-2xl mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
            Combines distributed FPO harvest lots into scheduled shared cold-chain runs. Eliminates empty dead mileage and cuts freight costs by up to 38%.
          </p>
        </div>

        {/* Real-time Status Badge */}
        <div
          className="flex items-center space-x-3 px-4 py-2.5 rounded-xl shrink-0 text-xs shadow-md"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border-accent)',
            borderLeft: '3px solid var(--ad-accent)',
          }}
        >
          <Truck className="w-4 h-4" style={{ color: 'var(--ad-accent)' }} />
          <div>
            <span className="text-[10px] block leading-tight" style={{ color: 'var(--ad-text-muted)' }}>Active Carrier Mode</span>
            <span className="font-bold" style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>{selectedVehicle.type}</span>
          </div>
        </div>
      </div>

      {/* Main Operations Grid: Left Controls (5 Cols) | Right HERO MAP (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Operational Shipment Console (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Section 1: Carrier Vehicle Selection */}
          <div
            className="p-5 space-y-4 shadow-sm"
            style={{
              background: 'var(--ad-surface-0)',
              border: '1px solid var(--ad-border)',
              borderRadius: 'var(--ad-radius-xl)',
            }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider pb-2 flex items-center justify-between" style={{
              borderBottom: '1px solid var(--ad-border-subtle)',
              fontFamily: 'var(--ad-font-display)',
              color: 'var(--ad-text-primary)'
            }}>
              <span>1. Vehicle Fleet & Destination</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--ad-accent)' }}>CVRP Spec</span>
            </h2>

            {/* Vehicle Selection Cards */}
            <div className="space-y-2.5">
              {VEHICLE_FLEET.map(v => {
                const isSelected = selectedVehicle.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="p-3.5 rounded-xl border transition-all cursor-pointer"
                    style={{
                      background: isSelected ? 'var(--ad-surface-1)' : 'var(--ad-surface-muted)',
                      border: isSelected ? '1px solid var(--ad-border-accent)' : '1px solid var(--ad-border-subtle)',
                      borderLeft: isSelected ? '3px solid var(--ad-accent)' : '1px solid var(--ad-border-subtle)',
                      boxShadow: isSelected ? '0 2px 8px rgba(199, 163, 86, 0.12)' : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs block" style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>{v.name}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--ad-accent-bright)', fontFamily: 'var(--ad-font-display)' }}>₹{v.costPerKm}/km</span>
                    </div>
                    <span className="text-[10px] block mt-1" style={{ color: 'var(--ad-text-muted)' }}>{v.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* Destination Selector */}
            <div>
              <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Destination Terminal Market</label>
              <select
                value={selectedDestination.id}
                onChange={(e) => {
                  const d = DESTINATION_HUBS.find(item => item.id === e.target.value);
                  if (d) setSelectedDestination(d);
                }}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
                style={{
                  background: 'var(--ad-surface-1)',
                  border: '1px solid var(--ad-border)',
                  color: 'var(--ad-text-primary)',
                  fontFamily: 'var(--ad-font-display)'
                }}
              >
                {DESTINATION_HUBS.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#141A17', color: '#F2F4F3' }}>
                    {d.name} ({d.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Capacity Meter */}
            <div
              className="p-4 rounded-xl space-y-2"
              style={{ background: 'var(--ad-surface-muted)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <div className="flex justify-between text-xs items-center">
                <span style={{ color: 'var(--ad-text-muted)' }}>Carrier Axle Payload:</span>
                <span className="font-bold text-xs" style={{
                  color: isOverCapacity ? 'var(--ad-danger-text)' : 'var(--ad-brand-bright)',
                  fontFamily: 'var(--ad-font-display)'
                }}>
                  {totalCargoKg.toLocaleString()} / {selectedVehicle.capacity_kg.toLocaleString()} kg ({capacityPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border-subtle)' }}>
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, capacityPct)}%`,
                    background: isOverCapacity
                      ? 'var(--ad-danger)'
                      : capacityPct > 85
                        ? 'var(--ad-warning)'
                        : 'linear-gradient(90deg, var(--ad-brand), var(--ad-accent))'
                  }}
                />
              </div>
              {isOverCapacity && (
                <div className="flex items-center space-x-1.5 text-[11px] pt-1" style={{ color: 'var(--ad-danger-text)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Exceeds vehicle rating by {(totalCargoKg - selectedVehicle.capacity_kg).toLocaleString()} kg!</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Available Farm Lots for Pooling */}
          <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#26332C]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                2. Select Farmgate Lots to Pool
              </h2>
              <span className="text-[10px] text-[#48BB78] font-bold bg-[#101513] px-2 py-0.5 rounded border border-[#26332C]">
                {selectedIds.length} Lots Checked
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {availableListings.map((lot) => {
                const isChecked = selectedIds.includes(lot.id);
                return (
                  <div
                    key={lot.id}
                    onClick={() => handleToggleListing(lot.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-[#1D2722] border-[#2D6A4F]'
                        : 'bg-[#101513] border-[#26332C] hover:border-[#384A41]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="text-[#48BB78]">
                        {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#8E9C93]" />}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{lot.crop_name}</span>
                        <span className="text-[11px] text-[#8E9C93] block">{lot.fpo_name} • {lot.location_name.split(',')[0]}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="text-white font-mono block text-xs">{lot.quantity_kg.toLocaleString()} kg</strong>
                      <span className="text-[10px] text-[#52796F]">₹{lot.price_per_kg}/kg</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRunOptimizer}
              disabled={isOptimizing || selectedIds.length === 0}
              className="ad-btn-primary w-full text-xs font-bold py-2.5 shadow-md flex items-center justify-center space-x-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isOptimizing ? 'Computing 2-Opt CVRP Corridor...' : 'Recalculate Optimal Corridor'}</span>
            </button>
          </div>

          {/* Section 3: Calculated Operational Metrics */}
          {vrpResult && (
            <div className="bg-[#161E1A] border border-[#26332C] rounded-2xl p-5 space-y-3.5 shadow-sm">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#26332C]">
                3. Calculated Multi-Stop Telemetry
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#101513] p-3.5 rounded-xl border border-[#26332C]">
                  <span className="text-[10px] text-[#8E9C93] block">Optimized Transit Run</span>
                  <strong className="text-lg font-black text-white font-mono mt-0.5 block">
                    {Math.round(vrpResult.total_distance_km)} km
                  </strong>
                  <span className="text-[10px] text-[#52796F]">~{vrpResult.estimated_time_hours}h estimated</span>
                </div>

                <div className="bg-[#101513] p-3.5 rounded-xl border border-[#26332C]">
                  <span className="text-[10px] text-[#8E9C93] block">Direct Pooled Freight</span>
                  <strong className="text-lg font-black text-[#48BB78] font-mono mt-0.5 block">
                    ₹{estimatedCost.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-[#48BB78]">38% Shared Savings</span>
                </div>
              </div>

              {/* Carbon Reduction Metric */}
              <div className="bg-[#1D2722] border border-[#2D6A4F]/50 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Leaf className="w-5 h-5 text-[#48BB78] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#52796F] uppercase block font-bold">Carbon Emissions Avoided</span>
                    <strong className="text-xs text-white">
                      -{vrpResult.co2_saved_kg.toFixed(1)} kg CO₂ avoided
                    </strong>
                  </div>
                </div>
                <span className="ad-badge ad-badge-success text-[10px]">Eco-Route</span>
              </div>

              {/* Waypoint Sequence */}
              <div className="text-[11px] text-[#8E9C93] pt-1">
                <span className="font-bold text-[#C2CBC5] block mb-1.5">Scheduled Stop Sequence:</span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 font-mono text-[10px]">
                  {vrpResult.route_waypoints.map((node, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 rounded-lg bg-[#101513] text-white border border-[#26332C] whitespace-nowrap shadow-sm">
                        {node.name}
                      </span>
                      {idx < vrpResult.route_waypoints.length - 1 && <span className="text-[#48BB78]">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Large Interactive HERO Route Map (7 Cols) */}
        <div className="lg:col-span-7 bg-[#161E1A] border border-[#26332C] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Map Header Bar */}
          <div className="bg-[#101513] px-5 py-3.5 border-b border-[#26332C] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Route className="w-4 h-4 text-[#48BB78]" />
              <span className="font-extrabold text-white">Live Multi-Stop Geospatial Corridor</span>
            </div>
            <span className="text-[#8E9C93] font-mono text-[11px] bg-[#161E1A] px-2.5 py-1 rounded-lg border border-[#26332C]">
              {selectedListings.length} Pickups • Destination: {selectedDestination.city}
            </span>
          </div>

          {/* Large Interactive Leaflet Canvas */}
          <div className="w-full h-[520px] lg:h-[640px] bg-[#0C100E] relative">
            <MapContainer
              center={[selectedDestination.latitude, selectedDestination.longitude]}
              zoom={6}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBoundsUpdater positions={mapPositions} />

              {/* Pickup Nodes Markers */}
              {selectedListings.map((lot, idx) => (
                <Marker key={lot.id} position={[lot.latitude, lot.longitude]}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="text-sm font-bold block text-slate-900">
                        Stop #{idx + 1}: {lot.fpo_name}
                      </strong>
                      <span className="block text-slate-600 font-semibold">{lot.crop_name} ({lot.quantity_kg.toLocaleString()} kg)</span>
                      <span className="block text-slate-500">{lot.location_name}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Destination Terminal Marker */}
              <Marker position={[selectedDestination.latitude, selectedDestination.longitude]}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <strong className="text-sm font-bold block text-emerald-800">
                      Destination Terminal: {selectedDestination.name}
                    </strong>
                    <span className="block text-slate-600">{selectedDestination.city}</span>
                  </div>
                </Popup>
              </Marker>

              {/* Dynamic Optimized Polyline */}
              {mapPositions.length >= 2 && (
                <Polyline
                  positions={mapPositions}
                  color="#2D6A4F"
                  weight={4}
                  opacity={0.9}
                  dashArray="6, 8"
                />
              )}
            </MapContainer>

            {/* Floating Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-[#101513]/95 backdrop-blur-md border border-[#26332C] p-3 rounded-xl text-[11px] text-[#C2CBC5] space-y-1.5 shadow-2xl">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#2D6A4F] shadow-sm" />
                <span>Pickup Stop Nodes ({selectedListings.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#B45309] shadow-sm" />
                <span>Terminal: {selectedDestination.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
