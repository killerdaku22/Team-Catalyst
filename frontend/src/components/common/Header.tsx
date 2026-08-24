import React from 'react';
import { UserRole } from '../../types';
import { Sprout, BarChart3, Truck, ShoppingCart, Landmark, Activity, Palette } from 'lucide-react';

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
  const navItems = [
    { id: 'ministry', label: 'Overview', icon: Landmark },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'farmer', label: 'Farmer Portal', icon: Sprout },
    { id: 'forecasting', label: 'Market Outlook', icon: BarChart3 },
    { id: 'logistics', label: 'Transport', icon: Truck },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--ad-nav-bg)',
        borderBottom: '1px solid var(--ad-nav-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('ministry')}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{
                background: 'var(--ad-green-600)',
                borderRadius: 'var(--ad-radius-md)',
              }}
            >
              <Sprout className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: 'var(--ad-text-primary)' }}
                >
                  AgriDirect
                </span>
                <span
                  className="text-ad-overline px-1.5 py-0.5"
                  style={{
                    color: 'var(--ad-text-tertiary)',
                    background: 'var(--ad-bg-alt)',
                    borderRadius: 'var(--ad-radius-sm)',
                    border: '1px solid var(--ad-border)',
                  }}
                >
                  SIH26033
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`ad-nav-item ${isActive ? 'ad-nav-item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon style={{ width: '15px', height: '15px' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Status & Role Selector */}
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div
              className="hidden lg:flex items-center space-x-1.5 px-2 py-1 text-ad-overline"
              style={{
                borderRadius: 'var(--ad-radius-sm)',
                background: 'var(--ad-bg-alt)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-tertiary)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isBackendConnected ? 'var(--ad-green-600)' : 'var(--ad-amber-600)',
                }}
                aria-hidden="true"
              />
              <span>
                {isBackendConnected ? 'Data connected' : 'Local data'}
              </span>
            </div>

            {/* Role Selector */}
            <div
              className="flex items-center space-x-1.5"
              style={{
                background: 'var(--ad-bg-alt)',
                border: '1px solid var(--ad-border)',
                borderRadius: 'var(--ad-radius-md)',
                padding: '4px',
              }}
            >
              <span
                className="text-ad-overline px-2 hidden sm:inline"
                style={{ color: 'var(--ad-text-tertiary)' }}
              >
                View as:
              </span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="ad-select"
                style={{
                  width: 'auto',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  padding: '4px 8px',
                  background: 'var(--ad-surface)',
                }}
                aria-label="Select user role"
              >
                <option value="MINISTRY_ADMIN">Policy Admin</option>
                <option value="BUYER">Buyer / Retailer</option>
                <option value="FPO">Farmer / FPO</option>
                <option value="LOGISTICS">Logistics</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
