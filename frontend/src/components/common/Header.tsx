import React from 'react';
import { UserRole } from '../../types';
import { Sprout, BarChart3, Truck, ShoppingCart, Landmark } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
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

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
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

          {/* Premium Horizontal Navigation Bar */}
          <nav className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner" aria-label="Main Navigation">
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
        </div>
      </div>
    </header>
  );
};
