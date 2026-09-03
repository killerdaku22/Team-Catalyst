import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  Sprout,
  Truck,
  ShoppingCart,
  Landmark,
  Menu,
  X,
  Radio,
  KeyRound,
  Layers,
  Scale,
  Building2,
  TrendingUp,
  User,
  ChevronDown
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { AgriDirectLogo } from './AgriDirectLogo';

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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  isBackendConnected = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Role-adaptive Navigation Configuration
  const getNavItemsForRole = (role: UserRole): NavItemConfig[] => {
    switch (role) {
      case 'FPO':
      case 'FARMER':
        return [
          { id: 'farmer', label: 'Produce', icon: Sprout },
          { id: 'decision', label: 'Decisions', icon: Scale },
          { id: 'best-market', label: 'Markets', icon: Building2 },
          { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
          { id: 'logistics', label: 'Transport', icon: Truck },
        ];
      case 'BUYER':
        return [
          { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
          { id: 'logistics', label: 'Transport', icon: Truck },
          { id: 'forecasting', label: 'Price Trends', icon: TrendingUp },
          { id: 'intelligence', label: 'Intelligence', icon: Radio },
        ];
      case 'LOGISTICS':
      case 'TRANSPORTER':
        return [
          { id: 'logistics', label: 'Routes & Fleet', icon: Truck },
          { id: 'marketplace', label: 'Available Loads', icon: ShoppingCart },
          { id: 'intelligence', label: 'Disruptions', icon: Radio },
        ];
      case 'DOCA_OBSERVER':
      case 'GOVT_AUDITOR':
      case 'MINISTRY_ADMIN':
      default:
        return [
          { id: 'ministry', label: 'Market Monitor', icon: Landmark },
          { id: 'intelligence', label: 'Intelligence', icon: Radio },
          { id: 'buffer', label: 'Supply & Buffer', icon: Layers },
          { id: 'forecasting', label: 'Price Trends', icon: TrendingUp },
          { id: 'decision', label: 'Decision Engine', icon: Scale },
        ];
    }
  };

  const navItems = getNavItemsForRole(activeRole);

  const roleDisplayNames: Record<string, string> = {
    FARMER: 'Farmer / FPO',
    FPO: 'Farmer / FPO',
    BUYER: 'Institutional Buyer',
    LOGISTICS: 'Transport Operator',
    TRANSPORTER: 'Transport Operator',
    DOCA_OBSERVER: 'DoCA Observer',
    GOVT_AUDITOR: 'Govt Auditor',
    MINISTRY_ADMIN: 'Ministry Admin',
  };

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'DOCA_OBSERVER' || role === 'MINISTRY_ADMIN' || role === 'GOVT_AUDITOR') {
      setActiveTab('ministry');
    } else if (role === 'BUYER') {
      setActiveTab('marketplace');
    } else if (role === 'LOGISTICS' || role === 'TRANSPORTER') {
      setActiveTab('logistics');
    } else {
      setActiveTab('farmer');
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b backdrop-blur-md print:hidden"
        style={{
          backgroundColor: 'rgba(11, 15, 13, 0.94)',
          borderColor: 'var(--ad-border, #273029)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* =========================================================
                LEFT: BRAND IDENTITY (Template B Specification)
                ========================================================= */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Mobile Menu Trigger (Left on mobile) */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 -ml-1.5 text-[#B8C4BC] hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7A356]"
                aria-label="Open mobile navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className="focus:outline-none group cursor-pointer"
                aria-label="AgriDirect Home"
              >
                <AgriDirectLogo size="md" showText />
              </button>
            </div>

            {/* =========================================================
                CENTER: DESKTOP NAVIGATION (Quiet Typography & Subtlety)
                ========================================================= */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C7A356] rounded-lg flex items-center space-x-1.5 cursor-pointer"
                    style={{
                      color: isActive ? '#F2F4F3' : '#8E9E94',
                      backgroundColor: isActive ? 'rgba(27, 35, 32, 0.6)' : 'transparent',
                      border: isActive ? '1px solid rgba(199, 163, 86, 0.25)' : '1px solid transparent',
                      fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = '#F2F4F3';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(20, 26, 23, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = '#8E9E94';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5 shrink-0 transition-colors"
                      style={{ color: isActive ? 'var(--ad-accent, #C7A356)' : '#6C7E73' }}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>

                    {/* Active underline cue (Quiet wheat gold) */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full"
                        style={{ backgroundColor: 'var(--ad-accent, #C7A356)' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* =========================================================
                RIGHT: ROLE SELECTOR + RESTRAINED GOLD SIGN IN
                ========================================================= */}
            <div className="flex items-center space-x-2.5 shrink-0">
              
              {/* Telemetry Status Dot (Quiet & Understated) */}
              <div
                className="hidden xl:flex items-center space-x-1.5 px-2 py-1 rounded-md text-[10px] text-[#7F8F85]"
                style={{ backgroundColor: '#141A17', border: '1px solid #273029' }}
                title={isBackendConnected ? "Local API connected" : "Calibrated simulation mode"}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isBackendConnected ? '#34C772' : '#C7A356' }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px]">{isBackendConnected ? 'Online' : 'Sim'}</span>
              </div>

              {/* Compact Role Selector (Template B) */}
              <div
                className="relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                style={{
                  backgroundColor: '#141A17',
                  border: '1px solid #273029',
                }}
              >
                <User className="w-3.5 h-3.5 text-[#C7A356] shrink-0" aria-hidden="true" />
                <span className="font-semibold text-xs text-[#F2F4F3] pr-1">
                  {roleDisplayNames[activeRole] || activeRole}
                </span>
                <ChevronDown className="w-3 h-3 text-[#7F8F85] shrink-0" aria-hidden="true" />
                
                {/* Native Accessible Select Overlay */}
                <select
                  value={activeRole}
                  onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Switch simulation user role"
                >
                  <option value="FARMER">Farmer / FPO</option>
                  <option value="BUYER">Institutional Buyer</option>
                  <option value="LOGISTICS">Transport Operator</option>
                  <option value="DOCA_OBSERVER">DoCA Market Observer</option>
                </select>
              </div>

              {/* Restrained Wheat / Gold Sign In Button */}
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7A356] cursor-pointer shadow-xs"
                style={{
                  backgroundColor: '#C7A356', // Wheat gold
                  color: '#0B0F0D',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#D4B36A';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#C7A356';
                }}
                title="Sign In with Seeded RBAC Accounts"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* =========================================================
          MOBILE MENU (DRAWER — Template B Specification 05)
          ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <div
            className="relative w-full max-w-xs h-full flex flex-col justify-between p-6 z-10 shadow-2xl border-r"
            style={{
              backgroundColor: '#141A17',
              borderColor: '#273029',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#273029]">
                <AgriDirectLogo size="sm" showText />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#7F8F85] hover:text-white rounded-lg focus:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation List with Clean Icons */}
              <nav className="py-5 space-y-1" aria-label="Mobile Menu Links">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left"
                      style={{
                        color: isActive ? '#C7A356' : '#B8C4BC',
                        backgroundColor: isActive ? 'rgba(199, 163, 86, 0.12)' : 'transparent',
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-[#273029] space-y-3">
              {/* Mobile Role Switcher */}
              <div
                className="relative flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: '#1B2320', border: '1px solid #273029' }}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-[#C7A356]" aria-hidden="true" />
                  <span className="text-white font-medium">{roleDisplayNames[activeRole]}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#7F8F85]" aria-hidden="true" />
                <select
                  value={activeRole}
                  onChange={(e) => {
                    handleRoleSelect(e.target.value as UserRole);
                    setMobileMenuOpen(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Switch active role"
                >
                  <option value="FARMER">Farmer / FPO</option>
                  <option value="BUYER">Institutional Buyer</option>
                  <option value="LOGISTICS">Transport Operator</option>
                  <option value="DOCA_OBSERVER">DoCA Market Observer</option>
                </select>
              </div>

              {/* Mobile Sign In */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                style={{ backgroundColor: '#C7A356', color: '#0B0F0D' }}
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Quick Modal (React Portal) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(role) => handleRoleSelect(role)}
      />
    </>
  );
};
