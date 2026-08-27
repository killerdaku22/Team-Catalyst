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
  DollarSign
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DataProvenance } from '../ui/DataProvenance';
import { CardSkeleton } from '../ui/LoadingState';

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
      map.fitBounds(bounds, { padding: [40, 40] });
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
  { id: 'delhi', name: 'Central Delhi Distribution Hub (Azadpur APMC)', city: 'Delhi-NCR', latitude: 28.6139, longitude: 77.2090 },
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
}

const VEHICLE_FLEET: VehicleOption[] = [
  { id: 'reefer-5k', name: '❄️ Cold-Chain Reefer Truck (5.0 T)', capacity_kg: 5000, costPerKm: 14.5, type: 'Refrigerated Cold-Chain' },
  { id: 'heavy-10k', name: '🚛 Multi-Axle Heavy Carrier (10.0 T)', capacity_kg: 10000, costPerKm: 22.0, type: 'Heavy Duty Bulk' },
  { id: 'ev-2.5k', name: '🚚 Green EV Commercial Van (2.5 T)', capacity_kg: 2500, costPerKm: 9.5, type: 'Zero Emission EV' },
];

export const LogisticsRouteView: React.FC = () => {
  const [availableListings, setAvailableListings] = useState<CropListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption>(DESTINATION_HUBS[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLE_FLEET[0]);
  const [vrpResult, setVrpResult] = useState<VRPResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  // Recalculate route whenever selections change
  const triggerOptimization = async (
    listings: CropListing[],
    currentSelectedIds: number[],
    dest: DestinationOption,
    vehicle: VehicleOption
  ) => {
    setOptimizing(true);
    const chosenListings = listings.filter(l => currentSelectedIds.includes(l.id));
    const activePickups = chosenListings.length > 0 ? chosenListings : listings.slice(0, 1);
    
    try {
      const result = await optimizeRoute(
        activePickups,
        { name: dest.name, latitude: dest.latitude, longitude: dest.longitude },
        vehicle.capacity_kg
      );
      setVrpResult(result);
    } catch (err: any) {
      console.warn("VRP route fallback:", err);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchListings().then(res => {
      setAvailableListings(res);
      const defaultSelected = res.slice(0, 2).map(item => item.id);
      setSelectedIds(defaultSelected);
      
      triggerOptimization(res, defaultSelected, selectedDestination, selectedVehicle).then(() => {
        setLoading(false);
      });
    });
  }, []);

  const toggleSelect = (id: number) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    triggerOptimization(availableListings, newSelected, selectedDestination, selectedVehicle);
  };

  const handleDestinationChange = (destId: string) => {
    const dest = DESTINATION_HUBS.find(d => d.id === destId) || DESTINATION_HUBS[0];
    setSelectedDestination(dest);
    triggerOptimization(availableListings, selectedIds, dest, selectedVehicle);
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = VEHICLE_FLEET.find(v => v.id === vehicleId) || VEHICLE_FLEET[0];
    setSelectedVehicle(vehicle);
    triggerOptimization(availableListings, selectedIds, selectedDestination, vehicle);
  };

  const totalSelectedWeightKg = availableListings
    .filter(l => selectedIds.includes(l.id))
    .reduce((sum, l) => sum + l.quantity_kg, 0);

  const isOverCapacity = totalSelectedWeightKg > selectedVehicle.capacity_kg;

  // Map markers & polyline positions
  const mapPositions: [number, number][] = vrpResult
    ? vrpResult.route_waypoints.map(w => [w.latitude, w.longitude] as [number, number])
    : [[selectedDestination.latitude, selectedDestination.longitude]];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest">
              Capacitated Vehicle Routing & Carbon Mitigation
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              SMART LOGISTICS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Pool nearby produce batches and move them through 2-Opt Capacitated Vehicle Routing (CVRP) to minimize empty backhauls and freight emissions.
            </p>
          </div>

          <DataProvenance source="2-Opt CVRP Logistics Solver" status="MODEL_OUTPUT" />
        </div>

        {/* Configuration Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Target Terminal Destination Hub:</label>
            <select
              value={selectedDestination.id}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl p-2 border border-slate-700 font-medium"
            >
              {DESTINATION_HUBS.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Assigned Vehicle Fleet:</label>
            <select
              value={selectedVehicle.id}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl p-2 border border-slate-700 font-medium"
            >
              {VEHICLE_FLEET.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: FPO Batch Selection List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Select Produce Batches to Pool</span>
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isOverCapacity
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {totalSelectedWeightKg.toLocaleString()} / {selectedVehicle.capacity_kg.toLocaleString()} kg
              </span>
            </div>

            {isOverCapacity && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Total weight exceeds vehicle capacity. Uncheck a batch or select a Heavy Carrier.</span>
              </div>
            )}

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {availableListings.map((listing) => {
                const isSelected = selectedIds.includes(listing.id);
                return (
                  <div
                    key={listing.id}
                    onClick={() => toggleSelect(listing.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 text-xs ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-white text-xs">{listing.crop_name}</strong>
                        <span className="font-mono text-emerald-400 font-bold">{listing.quantity_kg.toLocaleString()} kg</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{listing.fpo_name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{listing.location_name} • Shelf Life: {listing.shelf_life_days}d</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Leaflet Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 overflow-hidden relative min-h-[420px] flex flex-col">
            <div className="flex items-center justify-between pb-3 px-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Route className="w-4 h-4 text-cyan-400" />
                <span>Live Leaflet Waypoints & 2-Opt Corridor</span>
              </span>
              {optimizing && (
                <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                  Solving CVRP Heuristic...
                </span>
              )}
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden min-h-[340px] z-0 border border-slate-800">
              <MapContainer
                center={[selectedDestination.latitude, selectedDestination.longitude]}
                zoom={6}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', minHeight: '340px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {vrpResult?.route_waypoints.map((wp, index) => {
                  const isDest = index === vrpResult.route_waypoints.length - 1;
                  return (
                    <Marker key={index} position={[wp.latitude, wp.longitude]}>
                      <Popup>
                        <div className="p-1 font-sans text-xs">
                          <strong className="text-slate-900 block">{isDest ? '🏁 ' + wp.name : `Stop #${index + 1}: ${wp.fpo_name}`}</strong>
                          <span className="text-slate-600 block">{wp.crop_name ? `${wp.crop_name} (${wp.quantity_kg} kg)` : 'Destination Hub'}</span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {mapPositions.length > 1 && (
                  <Polyline
                    positions={mapPositions}
                    color="#10B981"
                    weight={4}
                    opacity={0.85}
                    dashArray="6 6"
                  />
                )}

                <MapBoundsUpdater positions={mapPositions} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom KPI Metrics Grid */}
      {vrpResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Capacity Utilization</span>
            <div className={`text-xl font-black ${
              isOverCapacity ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {vrpResult.vehicle_capacity_utilization_percent}%
            </div>
            <p className="text-[10px] text-slate-500">{totalSelectedWeightKg.toLocaleString()} / {selectedVehicle.capacity_kg.toLocaleString()} kg</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Pooled Route Distance</span>
            <div className="text-xl font-black text-white">
              {vrpResult.total_distance_km} km
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold">Saved {vrpResult.distance_saved_vs_unpooled_km} km vs separate trips</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Total Freight Cost</span>
            <div className="text-xl font-black text-cyan-400">
              ₹{Math.round(vrpResult.total_distance_km * selectedVehicle.costPerKm).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">₹{selectedVehicle.costPerKm}/km base tariff</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Carbon Emissions Avoided</span>
            <div className="text-xl font-black text-emerald-300">
              {vrpResult.co2_saved_kg} kg CO₂
            </div>
            <p className="text-[10px] text-slate-500">0.218 kg CO₂/km multiplier</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Estimated Transit Duration</span>
            <div className="text-xl font-black text-amber-400">
              {vrpResult.estimated_time_hours} hrs
            </div>
            <p className="text-[10px] text-slate-500">{vrpResult.stops_count} multi-stop pickups</p>
          </div>
        </div>
      )}
    </div>
  );
};
