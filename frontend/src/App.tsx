import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Header } from './components/common/Header';
import { MinistryAdminView } from './components/dashboard/MinistryAdminView';
import { BuyerPortalView } from './components/marketplace/BuyerPortalView';
import { FarmerPortalView } from './components/marketplace/FarmerPortalView';
import { DemandForecastView } from './components/forecasting/DemandForecastView';
import { LogisticsRouteView } from './components/logistics/LogisticsRouteView';

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('MINISTRY_ADMIN');
  const [activeTab, setActiveTab] = useState<string>('ministry');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check FastAPI backend connection status
    fetch('http://localhost:8000/api/v1/analytics/ministry-summary')
      .then(res => {
        if (res.ok) setIsBackendConnected(true);
      })
      .catch(() => setIsBackendConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'ministry' && <MinistryAdminView />}
        {activeTab === 'marketplace' && <BuyerPortalView />}
        {activeTab === 'farmer' && <FarmerPortalView />}
        {activeTab === 'forecasting' && <DemandForecastView />}
        {activeTab === 'logistics' && <LogisticsRouteView />}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200 font-mono">SIH26033 Prototype</span>
            <span>•</span>
            <span>Department of Consumer Affairs (DoCA)</span>
          </div>
          <div>
            Ministry of Consumer Affairs, Food & Public Distribution — Smart India Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
