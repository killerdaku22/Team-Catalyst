import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  Sprout,
  BarChart3,
  Truck,
  ShoppingCart,
  Landmark,
  UserCheck,
  Snowflake,
  ShieldAlert,
  Menu,
  X,
  Compass,
  Check
} from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected?: boolean;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  isBackendConnected = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role-adaptive Navigation Items
  const getNavItemsForRole = (role: UserRole): NavItemConfig[] => {
    switch (role) {
      case 'FPO':
      case 'FARMER':
        return [
          { id: 'farmer', label: 'Farmer Decision Portal', icon: Sprout },
          { id: 'marketplace', label: 'Direct Marketplace', icon: ShoppingCart },
          { id: 'storage', label: 'Cold Storage IoT', icon: Snowflake },
          { id: 'logistics', label: 'Pooled Transport', icon: Truck },
          { id: 'forecasting', label: 'Market Outlook', icon: BarChart3 },
          { id: 'ministry', label: 'National Monitor', icon: Landmark },
        ];
      case 'BUYER':
        return [
          { id: 'marketplace', label: 'Produce Sourcing & RFQs', icon: ShoppingCart },
          { id: 'forecasting', label: 'Price Outlook', icon: BarChart3 },
          { id: 'logistics', label: 'Logistics & Landed Cost', icon: Truck },
          { id: 'farmer', label: 'Farmer Origins', icon: Sprout },
          { id: 'ministry', label: 'Market Intelligence', icon: Landmark },
        ];
      case 'LOGISTICS':
      case 'TRANSPORTER':
        return [
          { id: 'logistics', label: 'Smart Route Pooling', icon: Truck },
          { id: 'storage', label: 'Cold-Chain Hubs', icon: Snowflake },
          { id: 'marketplace', label: 'Available Loads', icon: ShoppingCart },
          { id: 'forecasting', label: 'Freight Demand', icon: BarChart3 },
          { id: 'ministry', label: 'National Corridors', icon: Landmark },
        ];
      case 'MINISTRY_ADMIN':
      case 'GOVT_AUDITOR':
      default:
        return [
          { id: 'ministry', label: 'National Market Monitor', icon: Landmark },
          { id: 'buffer', label: 'Buffer Stock & MIS', icon: ShieldAlert },
          { id: 'forecasting', label: 'Forecasting & Shock Models', icon: BarChart3 },
          { id: 'storage', label: 'Cold Storage Infrastructure', icon: Snowflake },
          { id: 'logistics', label: 'Supply Corridors', icon: Truck },
          { id: 'marketplace', label: 'Direct Marketplace', icon: ShoppingCart },
          { id: 'farmer', label: 'Farmer Portal', icon: Sprout },
        ];
    }
  };

  const currentNavItems = getNavItemsForRole(activeRole);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'MINISTRY_ADMIN' || role === 'GOVT_AUDITOR') setActiveTab('ministry');
    else if (role === 'BUYER') setActiveTab('marketplace');
    else if (role === 'FPO' || role === 'FARMER') setActiveTab('farmer');
    else if (role === 'LOGISTICS' || role === 'TRANSPORTER') setActiveTab('logistics');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/90 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            onClick={() => handleNavClick(activeRole === 'FPO' ? 'farmer' : 'ministry')}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-md shadow-emerald-900/40 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                AgriDirect
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
                SIH Problem 26033
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner mx-2 space-x-1" aria-label="Main Navigation">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Role Switcher & Mobile Hamburger */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Connection Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-slate-400">{isBackendConnected ? 'Live API' : 'Fallback'}</span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden md:inline">
                Role:
              </span>
              <select
                value={activeRole}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="Select active experience role"
              >
                <option value="MINISTRY_ADMIN" className="bg-slate-900 text-slate-100">National Policy Monitor</option>
                <option value="FPO" className="bg-slate-900 text-slate-100">Farmer / FPO Producer</option>
                <option value="BUYER" className="bg-slate-900 text-slate-100">Direct Institutional Buyer</option>
                <option value="LOGISTICS" className="bg-slate-900 text-slate-100">Logistics Transporter</option>
              </select>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-2 animate-fadeIn">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2">Navigation ({activeRole})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
