import React from 'react';
import { UserRole } from '../../types';
import { Sprout, BarChart3, Truck, ShoppingCart, Landmark, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  isBackendConnected
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('ministry')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  AgriDirect
                </span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                  SIH26033
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">DoCA Ministry Direct Agri Marketplace & Logistics</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('ministry')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ministry'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>DoCA Ministry Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Direct Marketplace</span>
            </button>

            <button
              onClick={() => setActiveTab('forecasting')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'forecasting'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>AI Demand Forecasting</span>
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logistics'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Smart VRP Logistics</span>
            </button>
          </nav>

          {/* Role Selector & Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Activity className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-mono">
                {isBackendConnected ? 'FastAPI Engine Connected' : 'Engine Ready (Local)'}
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium px-2 hidden sm:inline">Persona:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-800 text-emerald-400 font-semibold text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="MINISTRY_ADMIN">🏛️ DoCA Ministry Admin</option>
                <option value="BUYER">🛒 Bulk Buyer / Retailer</option>
                <option value="FPO">🌾 Farmer / FPO Manager</option>
                <option value="LOGISTICS">🚚 Logistics Partner</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
