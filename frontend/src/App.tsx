import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from './types';
import { Header } from './components/common/Header';
import { MinistryAdminView } from './components/dashboard/MinistryAdminView';
import { BuyerPortalView } from './components/marketplace/BuyerPortalView';
import { FarmerPortalView } from './components/marketplace/FarmerPortalView';
import { DemandForecastView } from './components/forecasting/DemandForecastView';
import { LogisticsRouteView } from './components/logistics/LogisticsRouteView';
import { ColdStorageView } from './components/storage/ColdStorageView';
import { BufferStockView } from './components/buffer/BufferStockView';
import { LandingPageView } from './components/home/LandingPageView';
import { DecisionCenterView } from './components/decision/DecisionCenterView';
import { BestMarketView } from './components/marketplace/BestMarketView';
import { MarketIntelligenceView } from './components/intelligence/MarketIntelligenceView';
import { LoginPageView } from './components/auth/LoginPageView';
import { DesignSystem } from './components/common/DesignSystem';
import { VoiceKisanAssistant } from './components/voice/VoiceKisanAssistant';
import { Sprout } from 'lucide-react';

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25 },
};

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('FARMER');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api/v1';
    fetch(`${apiBase}/analytics/ministry-summary`)
      .then(res => {
        if (res.ok) setIsBackendConnected(true);
      })
      .catch(() => setIsBackendConnected(false));
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <LandingPageView
            onNavigate={(tab, role) => {
              setActiveTab(tab);
              if (role) setActiveRole(role as UserRole);
            }}
          />
        );
      case 'farmer':
        return <FarmerPortalView onNavigateToMarketplace={() => setActiveTab('marketplace')} />;
      case 'decision':
        return (
          <DecisionCenterView
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
            onNavigateToStorage={() => setActiveTab('storage')}
            onNavigateToLogistics={() => setActiveTab('logistics')}
          />
        );
      case 'best-market':
        return <BestMarketView onNavigateToLogistics={() => setActiveTab('logistics')} />;
      case 'marketplace':
        return <BuyerPortalView />;
      case 'logistics':
        return <LogisticsRouteView />;
      case 'forecasting':
        return <DemandForecastView />;
      case 'intelligence':
        return <MarketIntelligenceView />;
      case 'ministry':
        return <MinistryAdminView />;
      case 'buffer':
        return <BufferStockView />;
      case 'storage':
        return <ColdStorageView />;
      case 'design-system':
        return <DesignSystem />;
      case 'login':
        return (
          <LoginPageView
            onLoginSuccess={(role) => {
              setActiveRole(role);
              if (role === 'DOCA_OBSERVER' || role === 'MINISTRY_ADMIN' || role === 'GOVT_AUDITOR') setActiveTab('ministry');
              else if (role === 'BUYER') setActiveTab('marketplace');
              else if (role === 'FPO' || role === 'FARMER') setActiveTab('farmer');
              else if (role === 'LOGISTICS' || role === 'TRANSPORTER') setActiveTab('logistics');
            }}
            onNavigateHome={() => setActiveTab('home')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'var(--ad-bg)',
      color: 'var(--ad-text-primary)',
    }}>
      {/* Accessible Skip Landmark */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Compact Global Navigation */}
      <Header
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Container — Smooth page transitions */}
      <main id="main-content" className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer — Professional, not generic */}
      <footer
        className="mt-10"
        style={{
          borderTop: '1px solid var(--ad-border)',
          background: 'linear-gradient(180deg, var(--ad-surface-0) 0%, var(--ad-bg) 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Brand */}
            <div className="flex items-center space-x-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
              >
                <Sprout className="w-3.5 h-3.5" style={{ color: 'var(--ad-brand-bright)' }} />
              </div>
              <div>
                <span className="font-bold text-sm" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                  AgriDirect
                </span>
                <span className="mx-2 text-xs" style={{ color: 'var(--ad-border-strong)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>
                  Connecting Indian agriculture to fair, transparent markets
                </span>
              </div>
            </div>

            {/* Right: Links */}
            <div className="flex items-center space-x-4 text-[11px]" style={{ color: 'var(--ad-text-muted)' }}>
              <button
                onClick={() => setActiveTab('design-system')}
                className="transition-colors hover:text-[var(--ad-text-secondary)]"
                style={{ color: 'var(--ad-text-muted)' }}
              >
                Design System
              </button>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <span>Verified Data Sources</span>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Voice Assistant */}
      <VoiceKisanAssistant />
    </div>
  );
};

export default App;
