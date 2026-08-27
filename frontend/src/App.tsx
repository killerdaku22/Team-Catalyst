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
import { DesignSystem } from './components/common/DesignSystem';
import { VoiceKisanAssistant } from './components/voice/VoiceKisanAssistant';

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('MINISTRY_ADMIN');
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ad-bg)', color: 'var(--ad-text-primary)' }}>
      {/* Header Navigation */}
      <Header
        activeRole={activeRole}
        setActiveRole={(role) => {
          setActiveRole(role);
          if (role === 'MINISTRY_ADMIN') setActiveTab('ministry');
          else if (role === 'BUYER') setActiveTab('marketplace');
          else if (role === 'FPO') setActiveTab('farmer');
          else if (role === 'LOGISTICS') setActiveTab('logistics');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'home' && (
          <LandingPageView
            onNavigate={(tab, role) => {
              setActiveTab(tab);
              if (role) setActiveRole(role as UserRole);
            }}
          />
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
        {activeTab === 'design-system' && <DesignSystem />}
        {activeTab === 'ministry' && <MinistryAdminView />}
        {activeTab === 'marketplace' && <BuyerPortalView />}
        {activeTab === 'farmer' && <FarmerPortalView onNavigateToMarketplace={() => setActiveTab('marketplace')} />}
        {activeTab === 'storage' && <ColdStorageView />}
        {activeTab === 'buffer' && <BufferStockView />}
        {activeTab === 'forecasting' && <DemandForecastView />}
        {activeTab === 'logistics' && <LogisticsRouteView />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--ad-border)', background: 'var(--ad-surface)' }} className="py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-ad-caption gap-3" style={{ color: 'var(--ad-text-tertiary)' }}>
          <div className="flex items-center space-x-2">
            <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>AgriDirect</span>
            <span>•</span>
            <span>Agricultural Commerce & Market Intelligence Platform</span>
          </div>
          <div>
            Department of Consumer Affairs (DoCA) Direct Farmer-to-Consumer Engine.
          </div>
        </div>
      </footer>

      {/* Multilingual Voice Assistant (Bhashini AI) */}
      <VoiceKisanAssistant />
    </div>
  );
};

export default App;
