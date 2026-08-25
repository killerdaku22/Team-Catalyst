import React, { useEffect, useState } from 'react';
import { CropListing, VRPResult } from '../../types';
import { fetchListings, optimizeRoute } from '../../services/api';
import { Truck, Navigation, Leaf, ShieldAlert, CheckSquare, Square, Zap, MapPin, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  type: string;
}

const VEHICLE_FLEET: VehicleOption[] = [
  { id: 'reefer-5k', name: '❄️ Cold-Chain Reefer Truck', capacity_kg: 5000, type: 'Refrigerated' },
  { id: 'heavy-10k', name: '🚛 Multi-Axle Heavy Carrier', capacity_kg: 10000, type: 'Heavy Duty' },
  { id: 'ev-2.5k', name: '🚚 Green EV Commercial Van', capacity_kg: 2500, type: 'Zero Emission EV' },
];

export const LogisticsRouteView: React.FC = () => {
  const [availableListings, setAvailableListings] = useState<CropListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption>(DESTINATION_HUBS[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLE_FLEET[0]);
  const [vrpResult, setVrpResult] = useState<VRPResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  const runOptimization = async (listings: CropListing[], dest: DestinationOption, vehicle: VehicleOption) => {
    setOptimizing(true);
    const chosenListings = listings.filter(l => selectedIds.includes(l.id));
    const result = await optimizeRoute(
      chosenListings.length > 0 ? chosenListings : listings.slice(0, 2),
      { name: dest.name, latitude: dest.latitude, longitude: dest.longitude },
      vehicle.capacity_kg
    );
    setVrpResult(result);
    setOptimizing(false);
  };

  useEffect(() => {
    fetchListings().then(res => {
      setAvailableListings(res);
      const defaultSelected = res.slice(0, 2).map(item => item.id);
      setSelectedIds(defaultSelected);
      
      optimizeRoute(
        res.slice(0, 2),
        { name: selectedDestination.name, latitude: selectedDestination.latitude, longitude: selectedDestination.longitude },
        selectedVehicle.capacity_kg
      ).then(vrp => {
        setVrpResult(vrp);
        setLoading(false);
      });
    });
  }, []);

  const toggleSelect = (id: number) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
  };

  const handleRunVRP = () => {
    runOptimization(availableListings, selectedDestination, selectedVehicle);
  };

  if (loading || !vrpResult) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const mapPositions: [number, number][] = vrpResult.route_waypoints.map(w => [w.latitude, w.longitude]);
  const centerPos: [number, number] = mapPositions.length > 0 ? mapPositions[0] : [28.6139, 77.2090];
  
  // Cost calculations
  const totalWeight = vrpResult.total_weight_kg;
  const estimatedCostPooled = Math.round(1500 + vrpResult.total_distance_km * 12.5);
  const costPerKgPooled = totalWeight > 0 ? (estimatedCostPooled / totalWeight).toFixed(2) : '0.00';
  const estimatedCostUnpooled = Math.round(estimatedCostPooled * 2.4);
  const costPerKgUnpooled = totalWeight > 0 ? (estimatedCostUnpooled / totalWeight).toFixed(2) : '0.00';
  const savingsPercent = Math.round(((estimatedCostUnpooled - estimatedCostPooled) / estimatedCostUnpooled) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Vehicle Routing Problem (VRP) Solver
            </span>
            <span className="text-slate-400 text-xs font-mono">• Multi-Stop Farm Produce Pooling</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Smart Multi-Stop Logistics & Pooling Optimizer</h1>
          <p className="text-xs text-slate-300">
            Select origin farm clusters and urban destination terminals to calculate optimal route geometry and freight savings.
          </p>
        </div>

        <button
          onClick={handleRunVRP}
          disabled={optimizing || selectedIds.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 text-sm disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>{optimizing ? 'Recalculating...' : 'Optimize Pooled Route'}</span>
        </button>
      </div>

      {/* Origin & Destination Interactive Configuration Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Delivery Destination Terminal (Where to Deliver):</span>
          </label>
          <select
            value={selectedDestination.id}
            onChange={(e) => {
              const dest = DESTINATION_HUBS.find(d => d.id === e.target.value) || DESTINATION_HUBS[0];
              setSelectedDestination(dest);
            }}
            className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {DESTINATION_HUBS.map(hub => (
              <option key={hub.id} value={hub.id}>
                📍 {hub.name} ({hub.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vehicle Fleet Type & Capacity:</span>
          </label>
          <select
            value={selectedVehicle.id}
            onChange={(e) => {
              const veh = VEHICLE_FLEET.find(v => v.id === e.target.value) || VEHICLE_FLEET[0];
              setSelectedVehicle(veh);
            }}
            className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {VEHICLE_FLEET.map(veh => (
              <option key={veh.id} value={veh.id}>
                {veh.name} (Max {veh.capacity_kg.toLocaleString()} kg)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Listings Selection vs Map & VRP Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Farm Listing Selection (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center justify-between">
            <span>Select Origin Farms (From)</span>
            <span className="text-xs text-cyan-400 font-mono font-normal">{selectedIds.length} Selected</span>
          </h2>
          <p className="text-xs text-slate-400">Select produce batches to consolidate onto this route:</p>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {availableListings.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 text-cyan-400">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-cyan-400" /> : <Square className="w-5 h-5 text-slate-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-xs">{item.crop_name}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{item.quantity_kg} kg</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.fpo_name}</p>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-2">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        <span className="truncate">{item.location_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Leaflet Route Map & VRP Metrics (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Map Canvas */}
          <div className="glass-panel p-2 rounded-2xl border border-slate-800 overflow-hidden relative">
            <div className="h-[360px] w-full rounded-xl overflow-hidden z-10 relative">
              <MapContainer center={centerPos} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {mapPositions.length > 1 && (
                  <Polyline positions={mapPositions} color="#06b6d4" weight={4} dashArray="8, 8" />
                )}
                {vrpResult.route_waypoints.map((stop, idx) => (
                  <Marker key={idx} position={[stop.latitude, stop.longitude]}>
                    <Popup>
                      <div className="p-1 text-slate-900 font-sans text-xs">
                        <strong className="block text-sm font-bold">Stop #{idx + 1}: {stop.name}</strong>
                        {stop.crop_name && <div>Crop: {stop.crop_name} ({stop.quantity_kg} kg)</div>}
                        {stop.type && <div className="text-emerald-700 font-bold mt-1">{stop.type}</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Freight Cost & Efficiency Comparison */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block font-sans">Pooled Freight Cost:</span>
              <div className="text-lg font-extrabold text-emerald-400">₹{estimatedCostPooled.toLocaleString()}</div>
              <span className="text-[11px] text-emerald-500 font-sans">₹{costPerKgPooled}/kg transit rate</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block font-sans">Separate Individual Trips:</span>
              <div className="text-lg font-extrabold text-rose-400 line-through">₹{estimatedCostUnpooled.toLocaleString()}</div>
              <span className="text-[11px] text-rose-400 font-sans">₹{costPerKgUnpooled}/kg unpooled</span>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
              <span className="text-slate-400 text-[11px] block font-sans">Net Logistics Efficiency:</span>
              <div className="text-lg font-extrabold text-cyan-400">+{savingsPercent}% Savings</div>
              <span className="text-[11px] text-cyan-300 font-sans">Consolidated Cold-Chain</span>
            </div>
          </div>

          {/* VRP Analytics Dashboard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Payload Utilization</span>
              <div className="text-xl font-black text-white mt-1">{vrpResult.vehicle_capacity_utilization_percent}%</div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(vrpResult.vehicle_capacity_utilization_percent, 100)}%` }}></div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Route Distance</span>
              <div className="text-xl font-black text-cyan-400 mt-1">{vrpResult.total_distance_km} km</div>
              <span className="text-[10px] text-slate-400 block mt-1">Est. {vrpResult.estimated_time_hours} hrs</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Distance Saved</span>
              <div className="text-xl font-black text-emerald-400 mt-1">+{vrpResult.distance_saved_vs_unpooled_km} km</div>
              <span className="text-[10px] text-emerald-500 block mt-1">Via pooled waypoints</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">CO2 Saved</span>
              <div className="text-xl font-black text-teal-300 mt-1">{vrpResult.co2_saved_kg} kg</div>
              <span className="text-[10px] text-teal-400 block mt-1">Green logistics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
