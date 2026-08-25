import React from 'react';
import { UserRole } from '../../types';
import { Sprout } from 'lucide-react';

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
}) => {
  const handleDropdownChange = (value: string) => {
    setActiveTab(value);
    if (value === 'ministry') setActiveRole('MINISTRY_ADMIN');
    else if (value === 'marketplace') setActiveRole('BUYER');
    else if (value === 'farmer') setActiveRole('FPO');
    else if (value === 'forecasting') setActiveRole('MINISTRY_ADMIN');
    else if (value === 'logistics') setActiveRole('LOGISTICS');
  };

  return (
    <header
      className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md"
      style={{
        borderBottom: '1px solid var(--ad-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleDropdownChange('ministry')}
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-xl"
              style={{
                background: 'var(--ad-green-600)',
              }}
            >
              <Sprout className="w-5 h-5 text-slate-950" />
            </div>
            <span
              className="font-bold text-base tracking-tight text-white"
            >
              AgriDirect
            </span>
          </div>

          {/* Clean Module / Role Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-medium hidden sm:inline">
              Portal / Module:
            </label>
            <select
              value={activeTab}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-100 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
              aria-label="Select module"
            >
              <option value="ministry">🏛️ Policy Admin (Overview)</option>
              <option value="marketplace">🛒 Buyer / Retailer (Marketplace)</option>
              <option value="farmer">🌾 Farmer / FPO (Produce Listing)</option>
              <option value="forecasting">📈 Market Outlook (Price & Demand Forecast)</option>
              <option value="logistics">🚚 Smart Logistics (Transport Optimizer)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
