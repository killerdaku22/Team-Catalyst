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
import { DesignSystem } from './components/common/DesignSystem';
import { VoiceKisanAssistant } from './components/voice/VoiceKisanAssistant';
import { Radio, AlertCircle } from 'lucide-react';

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
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Header Navigation */}
      <Header
        activeRole={activeRole}
        setActiveRole={(role) => {
          setActiveRole(role);
          if (role === 'MINISTRY_ADMIN' || role === 'GOVT_AUDITOR') setActiveTab('ministry');
          else if (role === 'BUYER') setActiveTab('marketplace');
          else if (role === 'FPO' || role === 'FARMER') setActiveTab('decision');
          else if (role === 'LOGISTICS' || role === 'TRANSPORTER') setActiveTab('logistics');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
      />

      {/* Offline Resilient Telemetry Banner */}
      {!isBackendConnected && (
        <div className="bg-slate-900 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs text-slate-400 flex items-center justify-center space-x-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-slate-300">
            Operating in Calibrated Offline Mode • Deterministic economic models & historical AGMARKNET benchmarks active
          </span>
        </div>
      )}

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full" tabIndex={-1}>
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
        {activeTab === 'intelligence' && <MarketIntelligenceView />}
        {activeTab === 'forecasting' && <DemandForecastView />}
        {activeTab === 'logistics' && <LogisticsRouteView />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--ad-border)', background: 'var(--ad-surface)' }} className="py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-ad-caption gap-3" style={{ color: 'var(--ad-text-tertiary)' }}>
          <div className="flex items-center space-x-2">
            <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>AgriDirect</span>
            <span>•</span>
            <span>Smart Agricultural Decision & Direct Trade Platform</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-xs">
            <span>SIH26033</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('design-system')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
            >
              Design System
            </button>
            <span>•</span>
            <span className="text-ad-caption" style={{ color: 'var(--ad-text-tertiary)' }}>Ministry of Agriculture & Farmers Welfare (MoAFW) / DoCA</span>
          </div>
        </div>
      </footer>

      {/* Voice Kisan Assistant Widget */}
      <VoiceKisanAssistant />
    </div>
  );
};

export default App;

