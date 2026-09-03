import React, { useState } from 'react';
import {
  Sprout,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { AgriDirectLogo } from './AgriDirectLogo';

interface FooterProps {
  onNavigate?: (tab: string, role?: string) => void;
}

// AgriDirect Design 2 Lock: Warm Ivory (#FAF8F3) + Forest Green (#12281E / #1E4D34) + Muted Sage (#557061)

type ModalType = 'ABOUT' | 'TERMS' | 'PRIVACY' | 'SECURITY' | 'SUPPORT' | null;

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Mobile accordion collapse state
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState<{ [key: string]: boolean }>({
    platform: false,
    solutions: false,
    resources: false,
    company: false,
  });

  const toggleMobileSection = (key: string) => {
    setMobileSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = (tab: string, role?: string) => {
    if (onNavigate) {
      onNavigate(tab, role);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer
        className="w-full relative mt-10 sm:mt-12 border-t print:hidden"
        style={{
          backgroundColor: '#FAF8F3', // Warm ivory / off-white
          borderColor: '#E3EAE4',
          color: '#12281E', // Deep forest green
        }}
        aria-labelledby="footer-heading"
      >
        <h2 id="footer-heading" className="sr-only">AgriDirect Platform Footer</h2>

        {/* Minimal agricultural horizon contour line */}
        <div className="w-full h-1.5 overflow-hidden opacity-35 pointer-events-none" aria-hidden="true">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 6"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 4 C240 1, 480 5, 720 3 C960 1, 1200 5, 1440 2"
              stroke="#BACBBF"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-5">
          
          {/* =========================================================================
              COMPACT 12-COLUMN PRIMARY GRID
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* BRAND & DIRECT INFO (Cols 1–4 on Desktop) */}
            <div className="lg:col-span-4 space-y-3 pr-0 lg:pr-4">
              <AgriDirectLogo size="md" showText variant="light" />

              <p
                className="text-[11px] leading-relaxed max-w-xs text-[#455D4F]"
              >
                Transparent, efficient, and sustainable agricultural infrastructure. Direct market access, spatial price discovery, and shared cold freight.
              </p>

              {/* Lean Contact & Assistance */}
              <div className="flex items-center space-x-2 text-[11px] font-medium text-[#12281E] pt-1">
                <PhoneCall className="w-3 h-3 text-[#1E4D34]" aria-hidden="true" />
                <span className="font-mono font-semibold tracking-wide">1800-AGRI-DIRECT</span>
                <span className="text-[#88A291]">·</span>
                <span className="text-[#5A7364]">Toll Free (7 Languages)</span>
              </div>
            </div>

            {/* 4 NAVIGATION COLUMNS (Cols 5–12 on Desktop) */}
            <div className="lg:col-span-8">
              
              {/* DESKTOP VIEW: Clean 4-Column Grid with tight spacing */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-[11px]">
                
                {/* Column 1: Platform */}
                <nav aria-labelledby="footer-nav-platform" className="space-y-2">
                  <h3
                    id="footer-nav-platform"
                    className="font-bold text-[10px] uppercase tracking-wider block text-[#12281E]"
                    style={{ fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)' }}
                  >
                    Platform
                  </h3>
                  <ul className="space-y-1.5 text-[#455D4F]">
                    <li>
                      <button
                        onClick={() => handleNavClick('farmer')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        My Produce
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('decision')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Decisions
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('best-market')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Markets
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('marketplace')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Marketplace
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('logistics')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Transport
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('forecasting')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Analytics
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Column 2: Solutions */}
                <nav aria-labelledby="footer-nav-solutions" className="space-y-2">
                  <h3
                    id="footer-nav-solutions"
                    className="font-bold text-[10px] uppercase tracking-wider block text-[#12281E]"
                    style={{ fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)' }}
                  >
                    Solutions
                  </h3>
                  <ul className="space-y-1.5 text-[#455D4F]">
                    <li>
                      <button
                        onClick={() => handleNavClick('farmer', 'FARMER')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        For Farmers & FPOs
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('marketplace', 'BUYER')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        For Institutional Buyers
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('logistics', 'LOGISTICS')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        For Logistics Partners
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('ministry', 'DOCA_OBSERVER')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        For Government Observers
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('design-system')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Data System & Tokens
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Column 3: Resources */}
                <nav aria-labelledby="footer-nav-resources" className="space-y-2">
                  <h3
                    id="footer-nav-resources"
                    className="font-bold text-[10px] uppercase tracking-wider block text-[#12281E]"
                    style={{ fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)' }}
                  >
                    Resources
                  </h3>
                  <ul className="space-y-1.5 text-[#455D4F]">
                    <li>
                      <button
                        onClick={() => handleNavClick('intelligence')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Market Insights
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('forecasting')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Price Trends
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('storage')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Cold Chamber IoT
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavClick('buffer')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Buffer Silo Reserves
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveModal('SUPPORT')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Assistance & Support
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Column 4: Company */}
                <nav aria-labelledby="footer-nav-company" className="space-y-2">
                  <h3
                    id="footer-nav-company"
                    className="font-bold text-[10px] uppercase tracking-wider block text-[#12281E]"
                    style={{ fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)' }}
                  >
                    Company
                  </h3>
                  <ul className="space-y-1.5 text-[#455D4F]">
                    <li>
                      <button
                        onClick={() => setActiveModal('ABOUT')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        About AgriDirect
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveModal('TERMS')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Terms of Service
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveModal('PRIVACY')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveModal('SECURITY')}
                        className="hover:text-[#1E4D34] transition-colors text-left focus:outline-none focus-visible:underline"
                      >
                        Security & Provenance
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* MOBILE VIEW: Collapsible Accordion Navigation */}
              <div className="sm:hidden space-y-1 text-xs divide-y divide-[#EAEFEA]">
                
                {/* Mobile Section 1: Platform */}
                <div className="pt-1.5">
                  <button
                    onClick={() => toggleMobileSection('platform')}
                    className="w-full flex items-center justify-between py-1.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#12281E]"
                    aria-expanded={mobileSectionsOpen.platform}
                  >
                    <span>Platform</span>
                    {mobileSectionsOpen.platform ? <ChevronUp className="w-3.5 h-3.5 text-[#557061]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#557061]" />}
                  </button>
                  {mobileSectionsOpen.platform && (
                    <ul className="py-1.5 pl-2 space-y-1.5 text-[11px] text-[#455D4F]">
                      <li><button onClick={() => handleNavClick('farmer')} className="py-0.5">My Produce</button></li>
                      <li><button onClick={() => handleNavClick('decision')} className="py-0.5">Decisions</button></li>
                      <li><button onClick={() => handleNavClick('best-market')} className="py-0.5">Markets</button></li>
                      <li><button onClick={() => handleNavClick('marketplace')} className="py-0.5">Marketplace</button></li>
                      <li><button onClick={() => handleNavClick('logistics')} className="py-0.5">Transport</button></li>
                      <li><button onClick={() => handleNavClick('forecasting')} className="py-0.5">Analytics</button></li>
                    </ul>
                  )}
                </div>

                {/* Mobile Section 2: Solutions */}
                <div className="pt-1.5">
                  <button
                    onClick={() => toggleMobileSection('solutions')}
                    className="w-full flex items-center justify-between py-1.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#12281E]"
                    aria-expanded={mobileSectionsOpen.solutions}
                  >
                    <span>Solutions</span>
                    {mobileSectionsOpen.solutions ? <ChevronUp className="w-3.5 h-3.5 text-[#557061]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#557061]" />}
                  </button>
                  {mobileSectionsOpen.solutions && (
                    <ul className="py-1.5 pl-2 space-y-1.5 text-[11px] text-[#455D4F]">
                      <li><button onClick={() => handleNavClick('farmer', 'FARMER')} className="py-0.5">For Farmers & FPOs</button></li>
                      <li><button onClick={() => handleNavClick('marketplace', 'BUYER')} className="py-0.5">For Institutional Buyers</button></li>
                      <li><button onClick={() => handleNavClick('logistics', 'LOGISTICS')} className="py-0.5">For Logistics Partners</button></li>
                      <li><button onClick={() => handleNavClick('ministry', 'DOCA_OBSERVER')} className="py-0.5">For Government Observers</button></li>
                      <li><button onClick={() => handleNavClick('design-system')} className="py-0.5">Data System & Tokens</button></li>
                    </ul>
                  )}
                </div>

                {/* Mobile Section 3: Resources */}
                <div className="pt-1.5">
                  <button
                    onClick={() => toggleMobileSection('resources')}
                    className="w-full flex items-center justify-between py-1.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#12281E]"
                    aria-expanded={mobileSectionsOpen.resources}
                  >
                    <span>Resources</span>
                    {mobileSectionsOpen.resources ? <ChevronUp className="w-3.5 h-3.5 text-[#557061]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#557061]" />}
                  </button>
                  {mobileSectionsOpen.resources && (
                    <ul className="py-1.5 pl-2 space-y-1.5 text-[11px] text-[#455D4F]">
                      <li><button onClick={() => handleNavClick('intelligence')} className="py-0.5">Market Insights</button></li>
                      <li><button onClick={() => handleNavClick('forecasting')} className="py-0.5">Price Trends</button></li>
                      <li><button onClick={() => handleNavClick('storage')} className="py-0.5">Cold Chamber Telemetry</button></li>
                      <li><button onClick={() => handleNavClick('buffer')} className="py-0.5">Buffer Silo Reserves</button></li>
                      <li><button onClick={() => setActiveModal('SUPPORT')} className="py-0.5">Assistance & Support</button></li>
                    </ul>
                  )}
                </div>

                {/* Mobile Section 4: Company */}
                <div className="pt-1.5">
                  <button
                    onClick={() => toggleMobileSection('company')}
                    className="w-full flex items-center justify-between py-1.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#12281E]"
                    aria-expanded={mobileSectionsOpen.company}
                  >
                    <span>Company</span>
                    {mobileSectionsOpen.company ? <ChevronUp className="w-3.5 h-3.5 text-[#557061]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#557061]" />}
                  </button>
                  {mobileSectionsOpen.company && (
                    <ul className="py-1.5 pl-2 space-y-1.5 text-[11px] text-[#455D4F]">
                      <li><button onClick={() => setActiveModal('ABOUT')} className="py-0.5">About AgriDirect</button></li>
                      <li><button onClick={() => setActiveModal('TERMS')} className="py-0.5">Terms of Service</button></li>
                      <li><button onClick={() => setActiveModal('PRIVACY')} className="py-0.5">Privacy Policy</button></li>
                      <li><button onClick={() => setActiveModal('SECURITY')} className="py-0.5">Security & Provenance</button></li>
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              CONSOLIDATED BOTTOM STRIP (Single Line: Hubs + Copyright + Legal)
              ========================================================================= */}
          <div
            className="pt-4 mt-5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-[11px]"
            style={{
              borderTop: '1px solid #E6ECE7',
              color: '#526B5C',
            }}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>© 2026 AgriDirect Inc.</span>
              <span className="text-[#BACBBF]">·</span>
              <span className="font-medium text-[#12281E]">Analytical Hubs:</span>
              <span>Kolar · Nashik · Agra · Khanna</span>
              <span className="hidden sm:inline text-[#BACBBF]">·</span>
              <span className="hidden sm:inline text-[#688273]">Telemetry Active</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[#5D7768]">
              <button
                onClick={() => setActiveModal('TERMS')}
                className="hover:text-[#12281E] transition-colors focus:outline-none focus-visible:underline cursor-pointer"
              >
                Terms
              </button>
              <span className="text-[#D2DED4]">·</span>
              <button
                onClick={() => setActiveModal('PRIVACY')}
                className="hover:text-[#12281E] transition-colors focus:outline-none focus-visible:underline cursor-pointer"
              >
                Privacy
              </button>
              <span className="text-[#D2DED4]">·</span>
              <button
                onClick={() => setActiveModal('SECURITY')}
                className="hover:text-[#12281E] transition-colors focus:outline-none focus-visible:underline cursor-pointer"
              >
                Security
              </button>
              <span className="text-[#D2DED4]">·</span>
              <button
                onClick={() => setActiveModal('ABOUT')}
                className="hover:text-[#12281E] transition-colors focus:outline-none focus-visible:underline cursor-pointer"
              >
                About
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      <Modal
        open={activeModal === 'ABOUT'}
        onClose={() => setActiveModal(null)}
        title="About AgriDirect"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
          >
            <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--ad-font-display)' }}>
              Agricultural Commerce & Logistics Infrastructure
            </h4>
            <p className="text-xs text-[var(--ad-text-tertiary)]">
              AgriDirect is a production agricultural commerce platform connecting Farmer Producer Organizations (FPOs) directly with institutional buyers, state buffer reserves, and shared cold freight networks across India.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs text-white">Core Architectural Modules:</h5>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
              <li><strong>Farmgate Decision Center:</strong> Digital quality grading and optimal market recommendation based on net realization.</li>
              <li><strong>Spatial Arbitrage Engine:</strong> Haversine and OSRM road distance evaluation ensuring optimal destination routing.</li>
              <li><strong>Consolidated Logistics:</strong> Shared multi-stop refrigerated transport reducing transit spoilage and freight cost.</li>
              <li><strong>Price Telemetry & Forecasting:</strong> 14-day agricultural commodity price forecasting dampening regional supply shocks.</li>
            </ul>
          </div>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'TERMS'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2" style={{ color: 'var(--ad-text-secondary)' }}>
          <div>
            <h4 className="font-bold text-xs text-white">1. Direct Contracting & APMC Adherence</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              All transactions executed on AgriDirect operate under applicable Agricultural Produce Market guidelines. Registered Farmer Producer Organizations and institutional buyers enter into verified contracts upon confirmed order dispatch.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">2. Quality Standards & Settlement</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              Produce is cataloged at origin collection hubs according to established grading parameters. Transit degradation allowances are evaluated transparently through logged cold-chain sensor records.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">3. Data Transparency</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              Price indications, routing estimates, and forecasts are subject to explicit Data Provenance disclosures available within the respective analytical modules.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'PRIVACY'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2" style={{ color: 'var(--ad-text-secondary)' }}>
          <div>
            <h4 className="font-bold text-xs text-white">1. Data Ownership & Non-Brokering</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              AgriDirect does not sell, lease, or monetize individual farmer transaction records or personal identifiers to third-party speculative brokers.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">2. FPO Data Sovereignty</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              Cooperative unions and FPOs retain sovereign ownership of their member records, production volumes, and banking credentials. Aggregated market figures are used exclusively for transparent price discovery.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">3. Security Standards</h4>
            <p className="text-[11px] mt-1 text-[var(--ad-text-tertiary)]">
              All communications and telemetry payloads are secured with TLS 1.3 encryption and deterministic cryptographic audit hashing.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'SECURITY'}
        onClose={() => setActiveModal(null)}
        title="Security & Provenance Charter"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
          <div
            className="p-3.5 rounded-xl space-y-1.5"
            style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
          >
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--ad-brand-bright)]" />
              <span>Cryptographic Data Provenance</span>
            </div>
            <p className="text-[11px] text-[var(--ad-text-tertiary)]">
              Every market decision, buffer stock recommendation, and logistics itinerary maintains traceable attribution back to its origin sensor, Agmarknet mandi report, or OSRM road matrix calculation.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={activeModal === 'SUPPORT'}
        onClose={() => setActiveModal(null)}
        title="Assistance & Platform Support"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
          >
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <LifeBuoy className="w-4 h-4 text-[var(--ad-accent)]" />
              <span>Corridor Operations Support</span>
            </div>
            <p className="text-[11px] text-[var(--ad-text-tertiary)]">
              For operational questions regarding produce listing, buyer contracting, logistics dispatch, or mandi price discrepancies, please contact our support team.
            </p>
            <div className="pt-2 text-xs font-mono font-bold" style={{ color: 'var(--ad-accent-bright)' }}>
              Toll-Free: 1800-AGRI-DIRECT
            </div>
            <div className="text-[10px] text-[var(--ad-text-muted)]">
              Available Monday through Saturday, 06:00 to 20:00 IST in 7 Indian regional languages.
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
