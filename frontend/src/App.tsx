import React, { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1412] text-[#F5F7F5]">
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

      {/* Main Content Container — Max Width 1440px & Standard Gutter */}
      <main id="main-content" className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5" tabIndex={-1}>
        {activeTab === 'home' && (
          <LandingPageView
            onNavigate={(tab, role) => {
              setActiveTab(tab);
              if (role) setActiveRole(role as UserRole);
            }}
          />
        )}
        {activeTab === 'farmer' && (
          <FarmerPortalView onNavigateToMarketplace={() => setActiveTab('marketplace')} />
        )}
        {activeTab === 'decision' && (
          <DecisionCenterView
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
            onNavigateToStorage={() => setActiveTab('storage')}
            onNavigateToLogistics={() => setActiveTab('logistics')}
          />
        )}
        {activeTab === 'best-market' && (
          <BestMarketView
            onNavigateToLogistics={() => setActiveTab('logistics')}
          />
        )}
        {activeTab === 'marketplace' && <BuyerPortalView />}
        {activeTab === 'logistics' && <LogisticsRouteView />}
        {activeTab === 'forecasting' && <DemandForecastView />}
        {activeTab === 'intelligence' && <MarketIntelligenceView />}
        {activeTab === 'ministry' && <MinistryAdminView />}
        {activeTab === 'buffer' && <BufferStockView />}
        {activeTab === 'storage' && <ColdStorageView />}
        {activeTab === 'design-system' && <DesignSystem />}
        {activeTab === 'login' && (
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
        )}
      </main>

      {/* Clean Compact Footer */}
      <footer className="border-t border-[#2B3731] bg-[#121815] py-4 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E9C93] gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">AgriDirect</span>
            <span>•</span>
            <span>Agricultural Commerce & Market Intelligence Platform</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setActiveTab('design-system')}
              className="text-[#52796F] hover:text-[#709A7E] font-medium transition-colors"
            >
              Design Tokens
            </button>
            <span>•</span>
            <span>Verified Data Provenance</span>
          </div>
        </div>
      </footer>

      {/* Compact Bottom-Right Floating Voice Assistant */}
      <VoiceKisanAssistant />
    </div>
  );
};

export default App;
