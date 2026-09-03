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
import { Footer } from './components/common/Footer';
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

      {/* Professional Multi-Column Enterprise Footer */}
      <Footer
        onNavigate={(tab, role) => {
          setActiveTab(tab);
          if (role) setActiveRole(role as any);
        }}
      />

      {/* Floating Voice Assistant */}
      <VoiceKisanAssistant />
    </div>
  );
};

export default App;
