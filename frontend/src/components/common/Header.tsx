import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  Sprout,
  BarChart3,
  Truck,
  ShoppingCart,
  Landmark,
  UserCheck,
  Menu,
  X,
  Radio,
  KeyRound,
  Layers,
  Scale,
  Building2,
  TrendingUp,
  ShieldCheck,
  Inbox,
  ChevronDown
} from 'lucide-react';
import { AuthModal } from './AuthModal';

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

  // Role-adaptive Compact Navigation Items
  const getNavItemsForRole = (role: UserRole): NavItemConfig[] => {
    switch (role) {
      case 'FPO':
      case 'FARMER':
        return [
          { id: 'farmer', label: 'My Produce', icon: Sprout },
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
    <header className="sticky top-0 z-40 border-b" style={{
      background: 'linear-gradient(180deg, #121815 0%, #0E1310 100%)',
      borderColor: 'var(--ad-border)',
      backdropFilter: 'blur(12px)',
    }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[56px]">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-2.5 text-left focus:outline-none group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #2D7A52 0%, #1F5C3D 100%)',
                  boxShadow: '0 0 16px rgba(40, 114, 78, 0.2)',
                }}
              >
                <Sprout className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col">
                <span
                  className="font-bold text-white text-[15px] leading-none tracking-tight"
                  style={{ fontFamily: 'var(--ad-font-display)' }}
                >
                  AgriDirect
                </span>
                <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--ad-text-muted)' }}>
                  Agricultural Commerce
                </span>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation — Underline-style active indicator */}
          <nav className="hidden lg:flex items-center space-x-0.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--ad-text-primary)' : 'var(--ad-text-tertiary)',
                    background: isActive ? 'var(--ad-surface-1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--ad-text-secondary)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--ad-surface-0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--ad-text-tertiary)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{
                    color: isActive ? 'var(--ad-accent)' : 'inherit'
                  }} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {/* Active underline indicator */}
                  {isActive && (
                    <span
                      className="absolute bottom-[-13px] left-3 right-3 h-[2px] rounded-full"
                      style={{ background: 'var(--ad-accent)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Status + Role + Auth */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Connection Indicator */}
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px]"
              style={{ background: 'var(--ad-surface-0)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isBackendConnected ? 'var(--ad-success-text)' : 'var(--ad-warning-text)' }}
              />
              <span style={{ color: 'var(--ad-text-muted)' }}>
                {isBackendConnected ? 'Online' : 'Calibrated'}
              </span>
            </div>

            {/* Role Selector — Styled custom dropdown look */}
            <div
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{
                background: 'var(--ad-surface-0)',
                border: '1px solid var(--ad-border)',
              }}
              title="Demo role simulation"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ad-accent)' }} />
              <select
                value={activeRole}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className="bg-transparent font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}
                aria-label="Demo active role"
              >
                <option value="FARMER" style={{ background: '#141A17', color: '#F2F4F3' }}>Farmer / FPO</option>
                <option value="BUYER" style={{ background: '#141A17', color: '#F2F4F3' }}>Institutional Buyer</option>
                <option value="LOGISTICS" style={{ background: '#141A17', color: '#F2F4F3' }}>Transport Operator</option>
                <option value="DOCA_OBSERVER" style={{ background: '#141A17', color: '#F2F4F3' }}>DoCA Market Observer</option>
              </select>
            </div>

            {/* Sign In Button — Gold accent, distinctive */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center space-x-1.5"
              style={{
                background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                color: '#0B0F0D',
                boxShadow: '0 2px 8px rgba(199, 163, 86, 0.2)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(199, 163, 86, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(199, 163, 86, 0.2)';
              }}
              title="Sign In with Seeded RBAC Accounts"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign In</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{
                background: 'var(--ad-surface-0)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-secondary)',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(role) => {
          handleRoleSelect(role);
        }}
      />

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden px-4 py-3 space-y-1"
          style={{
            background: 'var(--ad-surface-0)',
            borderBottom: '1px solid var(--ad-border)',
          }}
        >
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
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: isActive ? 'var(--ad-surface-1)' : 'transparent',
                  color: isActive ? 'var(--ad-text-primary)' : 'var(--ad-text-tertiary)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--ad-accent)' : 'inherit' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
