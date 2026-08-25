import React from 'react';
import { UserRole } from '../../types';
import { Sprout, BarChart3, Truck, ShoppingCart, Landmark, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    { id: 'ministry', label: 'Overview', icon: Landmark, role: 'MINISTRY_ADMIN' as UserRole },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart, role: 'BUYER' as UserRole },
    { id: 'farmer', label: 'Farmer Portal', icon: Sprout, role: 'FPO' as UserRole },
    { id: 'forecasting', label: 'Market Outlook', icon: BarChart3, role: 'MINISTRY_ADMIN' as UserRole },
    { id: 'logistics', label: 'Transport', icon: Truck, role: 'LOGISTICS' as UserRole },
  ];

  const handleNavClick = (tabId: string, role: UserRole) => {
    setActiveTab(tabId);
    setActiveRole(role);
  };

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'MINISTRY_ADMIN') setActiveTab('ministry');
    else if (role === 'BUYER') setActiveTab('marketplace');
    else if (role === 'FPO') setActiveTab('farmer');
    else if (role === 'LOGISTICS') setActiveTab('logistics');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            onClick={() => handleNavClick('ministry', 'MINISTRY_ADMIN')}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">
                AgriDirect
              </span>
            </div>
          </div>

          {/* Center: Premium Horizontal Navigation Bar */}
          <nav className="hidden md:flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner mx-4" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.role)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: View As Role Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800/90 px-3 py-1.5 rounded-xl shadow-sm shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider hidden lg:inline">
              View as:
            </span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
              className="bg-transparent text-emerald-400 font-bold text-xs sm:text-sm focus:outline-none cursor-pointer pr-1"
              aria-label="Select user role"
            >
              <option value="MINISTRY_ADMIN" className="bg-slate-900 text-slate-100">Policy Admin</option>
              <option value="BUYER" className="bg-slate-900 text-slate-100">Buyer / Retailer</option>
              <option value="FPO" className="bg-slate-900 text-slate-100">Farmer / FPO</option>
              <option value="LOGISTICS" className="bg-slate-900 text-slate-100">Logistics Operator</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
