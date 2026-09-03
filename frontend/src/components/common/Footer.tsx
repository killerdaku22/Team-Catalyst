import React from 'react';
import {
  Sprout,
  ShieldCheck,
  Radio,
  ExternalLink,
  MapPin,
  Truck,
  Database,
  PhoneCall,
  Activity,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      className="mt-16 pt-12 pb-8 border-t relative overflow-hidden"
      style={{
        borderColor: 'var(--ad-border)',
        background: 'linear-gradient(180deg, var(--ad-surface-0) 0%, var(--ad-bg) 100%)',
      }}
    >
      {/* Subtle background ambient glow */}
      <div
        className="absolute top-0 left-1/4 w-96 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(52, 199, 114, 0.03)' }}
      />
      <div
        className="absolute top-0 right-1/4 w-96 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(199, 163, 86, 0.03)' }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
          {/* Column 1: Brand & Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #2D7A52 0%, #1F5C3D 100%)',
                  boxShadow: '0 2px 8px rgba(45, 122, 82, 0.3)',
                }}
              >
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span
                className="font-black text-lg tracking-tight"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Agri<span style={{ color: 'var(--ad-accent-bright)' }}>Direct</span>
              </span>
            </div>

            <p className="text-xs leading-relaxed max-w-sm" style={{ color: 'var(--ad-text-tertiary)' }}>
              Next-generation agricultural commerce infrastructure disintermediating Indian agricultural supply chains. Connecting verified Farmer Producer Organizations (FPOs) directly with institutional buyers, state buffer silos, and cold freight networks.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: 'var(--ad-brand-light)',
                  color: 'var(--ad-brand-bright)',
                  border: '1px solid rgba(52, 199, 114, 0.2)',
                  fontFamily: 'var(--ad-font-display)'
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>WDRA Accredited</span>
              </span>
              <span
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: 'var(--ad-accent-light)',
                  color: 'var(--ad-accent-bright)',
                  border: '1px solid var(--ad-border-accent)',
                  fontFamily: 'var(--ad-font-display)'
                }}
              >
                <Award className="w-3 h-3" />
                <span>DoCA Integrated</span>
              </span>
            </div>
          </div>

          {/* Column 2: Platform & Modules (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
            >
              Commerce Platform
            </h4>
            <ul className="space-y-2 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
              <li>
                <button
                  onClick={() => onNavigate?.('decision')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Decision Center & Harvest Uplift
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('marketplace')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Direct Produce Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('best-market')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Spatial Mandi Arbitrage Matrix
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('logistics')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Pooled Cold Logistics & VRP Routing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('storage')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  WDRA Cold Storage IoT Telemetry
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('buffer')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Strategic Grain Silo Management
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Data & Intelligence (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
            >
              Intelligence
            </h4>
            <ul className="space-y-2 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
              <li>
                <button
                  onClick={() => onNavigate?.('forecasting')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Demand & Price Forecasting
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('intelligence')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Regional Disruption Intelligence
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('ministry')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  DoCA Consumer Price Oversight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('design-system')}
                  className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                >
                  Design Tokens & UI Kit
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Active Corridors & Assistance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
            >
              Corridors & Support
            </h4>
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>Kisan Voice Hotline</span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded font-bold"
                  style={{ background: 'var(--ad-brand-light)', color: 'var(--ad-brand-bright)' }}
                >
                  7 Languages
                </span>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>
                Dial hands-free voice assistance for mandi arrivals, price realization, and convoy dispatch.
              </p>
              <div className="flex items-center space-x-1.5 pt-1 text-[11px] font-bold" style={{ color: 'var(--ad-accent-bright)' }}>
                <PhoneCall className="w-3.5 h-3.5" />
                <span>1800-AGRI-DIRECT (Toll Free)</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>
              <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--ad-cool)' }} />
              <span>Hubs in Kolar (KA), Nashik (MH), Agra (UP), Ludhiana (PB)</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]"
          style={{ borderTop: '1px solid var(--ad-border)', color: 'var(--ad-text-muted)' }}
        >
          <div className="flex items-center space-x-2">
            <span>© 2026 AgriDirect Inc. Developed for Smart India Hackathon (SIH 2026).</span>
          </div>

          {/* Real-time Network Status Indicator */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>
              All 18 APMC Corridors Operational
            </span>
            <span style={{ color: 'var(--ad-border)' }}>·</span>
            <span style={{ color: 'var(--ad-text-muted)' }}>OSRM Road Engine Active</span>
            <span style={{ color: 'var(--ad-border)' }}>·</span>
            <span style={{ color: 'var(--ad-accent-bright)' }}>v2.4 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
