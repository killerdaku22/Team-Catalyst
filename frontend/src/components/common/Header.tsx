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
  Inbox
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
  icon: React.ComponentType<{ className?: string }>;
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
    <header className="sticky top-0 z-40 bg-[#121815] border-b border-[#2B3731] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-2 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base leading-none tracking-tight">AgriDirect</span>
                <span className="text-[10px] text-[#8E9C93] font-medium leading-tight">Agricultural Commerce</span>
              </div>
            </button>
          </div>

          {/* Center: Role-Aware Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#222C27] text-[#48BB78] border border-[#2B3731]'
                      : 'text-[#C2CBC5] hover:text-white hover:bg-[#1A221E]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#48BB78]' : 'text-[#8E9C93]'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Role Selector & Auth Button */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Connection Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded bg-[#1A221E] border border-[#2B3731] text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-[#48BB78]' : 'bg-[#ED8936]'}`} />
              <span className="text-[#8E9C93]">{isBackendConnected ? 'Online' : 'Calibrated'}</span>
            </div>

            {/* Compact Demo Role Selector */}
            <div className="flex items-center space-x-1.5 bg-[#1A221E] border border-[#2B3731] px-2.5 py-1 rounded-md text-xs" title="Demo role simulation">
              <span className="text-[10px] text-[#52796F] font-bold uppercase tracking-wider hidden xl:inline">Demo Role:</span>
              <UserCheck className="w-3.5 h-3.5 text-[#52796F] shrink-0" />
              <select
                value={activeRole}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className="bg-transparent text-[#F5F7F5] font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="Demo active role"
              >
                <option value="FARMER" className="bg-[#1A221E] text-white">Farmer / FPO</option>
                <option value="BUYER" className="bg-[#1A221E] text-white">Institutional Buyer</option>
                <option value="LOGISTICS" className="bg-[#1A221E] text-white">Transport Operator</option>
                <option value="DOCA_OBSERVER" className="bg-[#1A221E] text-white">DoCA Market Observer</option>
              </select>
            </div>

            {/* Sign In / Switch Button */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-[#2D6A4F] hover:bg-[#245740] text-white px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1"
              title="Sign In with Seeded RBAC Accounts"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign In</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md bg-[#1A221E] border border-[#2B3731] text-[#C2CBC5] hover:text-white"
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
        <div className="lg:hidden bg-[#151B18] border-b border-[#2B3731] px-4 py-3 space-y-1">
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
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-semibold ${
                  isActive
                    ? 'bg-[#222C27] text-[#48BB78]'
                    : 'text-[#C2CBC5] hover:bg-[#1A221E]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
