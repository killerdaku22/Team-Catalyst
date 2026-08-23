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

export const LogisticsRouteView: React.FC = () => {
  const [availableListings, setAvailableListings] = useState<CropListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [vrpResult, setVrpResult] = useState<VRPResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchListings().then(res => {
      setAvailableListings(res);
      // Select first two by default
      const defaultSelected = res.slice(0, 2).map(item => item.id);
      setSelectedIds(defaultSelected);
      
      // Initial optimization run
      optimizeRoute(res.slice(0, 2)).then(vrp => {
        setVrpResult(vrp);
        setLoading(false);
      });
    });
  }, []);

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRunVRP = async () => {
    setOptimizing(true);
    const chosenListings = availableListings.filter(l => selectedIds.includes(l.id));
    const result = await optimizeRoute(chosenListings);
    setVrpResult(result);
    setOptimizing(false);
  };

  if (loading || !vrpResult) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Generate polyline positions for Leaflet Map
  const mapPositions: [number, number][] = vrpResult.route_waypoints.map(w => [w.latitude, w.longitude]);
  const centerPos: [number, number] = mapPositions.length > 0 ? mapPositions[0] : [28.6139, 77.2090];

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
            Pool farm produce across adjacent FPO clusters into high-capacity cold-chain transport, reducing transit costs & carbon footprint.
          </p>
        </div>

        <button
          onClick={handleRunVRP}
          disabled={optimizing || selectedIds.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 text-sm disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>{optimizing ? 'Calculating Route...' : 'Run VRP Route Optimizer'}</span>
        </button>
      </div>

      {/* Main Grid: Listings Selection vs Map & VRP Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Farm Listing Selection (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center justify-between">
            <span>Select Farms to Pool</span>
            <span className="text-xs text-cyan-400 font-mono font-normal">{selectedIds.length} Selected</span>
          </h2>
          <p className="text-xs text-slate-400">Combine small farm orders to optimize payload capacity</p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
              <MapContainer center={centerPos} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

          {/* VRP Analytics Dashboard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Vehicle Payload Utilization</span>
              <div className="text-xl font-black text-white mt-1">{vrpResult.vehicle_capacity_utilization_percent}%</div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${vrpResult.vehicle_capacity_utilization_percent}%` }}></div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Total Route Distance</span>
              <div className="text-xl font-black text-cyan-400 mt-1">{vrpResult.total_distance_km} km</div>
              <span className="text-[10px] text-slate-400 block mt-1">Est. {vrpResult.estimated_time_hours} hrs travel</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Distance Saved (Pooled)</span>
              <div className="text-xl font-black text-emerald-400 mt-1">+{vrpResult.distance_saved_vs_unpooled_km} km</div>
              <span className="text-[10px] text-emerald-500 block mt-1">Vs unpooled individual trips</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">CO2 Emissions Reduced</span>
              <div className="text-xl font-black text-teal-300 mt-1">{vrpResult.co2_saved_kg} kg</div>
              <span className="text-[10px] text-teal-400 block mt-1">Green Logistics Impact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
