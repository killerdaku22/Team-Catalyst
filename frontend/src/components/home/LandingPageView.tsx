import React, { useRef, useState, useEffect } from 'react';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  TrendingUp,
  Truck,
  BarChart3
} from 'lucide-react';
import { ValueChainSlider } from './ValueChainSlider';

interface LandingPageViewProps {
  onNavigate: (tabId: string, role?: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const [journeyVideoPlaying, setJourneyVideoPlaying] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const journeyVideoRef = useRef<HTMLVideoElement>(null);

  // Guarantee browser muted autoplay compliance
  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = true;
      heroVideoRef.current.play().catch(() => setHeroVideoPlaying(false));
    }
    if (journeyVideoRef.current) {
      journeyVideoRef.current.muted = true;
      journeyVideoRef.current.play().catch(() => setJourneyVideoPlaying(false));
    }
  }, []);

  const toggleHeroVideo = () => {
    if (heroVideoRef.current) {
      if (heroVideoPlaying) {
        heroVideoRef.current.pause();
        setHeroVideoPlaying(false);
      } else {
        heroVideoRef.current.play();
        setHeroVideoPlaying(true);
      }
    }
  };

  const toggleJourneyVideo = () => {
    if (journeyVideoRef.current) {
      if (journeyVideoPlaying) {
        journeyVideoRef.current.pause();
        setJourneyVideoPlaying(false);
      } else {
        journeyVideoRef.current.play();
        setJourneyVideoPlaying(true);
      }
    }
  };

  return (
    <div className="space-y-14 animate-fadeIn pb-10">
      {/* ============================================================
          SECTION 1 — HERO
          ============================================================ */}
      <section
        className="relative overflow-hidden shadow-xl"
        style={{
          borderRadius: 'var(--ad-radius-xl)',
          background: 'var(--ad-surface-0)',
          border: '1px solid var(--ad-border)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between z-10 space-y-8">
            <div className="space-y-5">
              <div
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: 'var(--ad-accent-light)',
                  border: '1px solid var(--ad-border-accent)',
                  color: 'var(--ad-accent)',
                }}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Agricultural Commerce & Market Intelligence</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.08]"
                style={{
                  fontFamily: 'var(--ad-font-display)',
                  color: 'var(--ad-text-primary)',
                }}
              >
                Real Farmers.<br />
                <span style={{ color: 'var(--ad-accent)' }}>Real Markets.</span><br />
                Real Impact.
              </h1>

              <p
                className="text-sm sm:text-base max-w-lg font-normal leading-relaxed"
                style={{ color: 'var(--ad-text-secondary)' }}
              >
                Direct agricultural trade, 14-day price forecasting, and shared cold-chain logistics connecting producers with the markets that need them most.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('marketplace', 'BUYER')}
                className="ad-btn-primary px-6 py-3 text-sm"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('farm-gallery-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ad-btn-secondary px-5 py-3 text-sm"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Indicators — Not just green checkmarks */}
            <div
              className="grid grid-cols-3 gap-4 pt-5"
              style={{ borderTop: '1px solid var(--ad-border)' }}
            >
              {[
                { icon: ShieldCheck, label: 'Direct FPO Trade', color: 'var(--ad-brand-bright)' },
                { icon: TrendingUp, label: '14-Day Forecasting', color: 'var(--ad-accent)' },
                { icon: Truck, label: 'Pooled Logistics', color: 'var(--ad-cool-bright)' },
              ].map((item) => (
                <div key={item.label} className="flex items-center space-x-2 text-xs" style={{ color: 'var(--ad-text-tertiary)' }}>
                  <item.icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Video */}
          <div
            className="lg:col-span-5 relative min-h-[280px] lg:min-h-full overflow-hidden flex items-center justify-center cursor-pointer group"
            style={{ background: 'var(--ad-bg)' }}
            onClick={toggleHeroVideo}
          >
            <video
              ref={heroVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/assets/agridirect-farm-hero.webp.png"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            >
              <source src="/assets/agridirect-farm-hero-video.mp4" type="video/mp4" />
              <source src="/assets/Wheat_and_vegetable_fields_moving_202608280019.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 lg:block hidden" style={{
              background: 'linear-gradient(to right, var(--ad-surface-0) 0%, rgba(20, 26, 23, 0.4) 30%, transparent 100%)'
            }} />
            <div className="absolute inset-0 lg:hidden block" style={{
              background: 'linear-gradient(to top, var(--ad-surface-0) 0%, transparent 50%)'
            }} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleHeroVideo();
              }}
              className="absolute bottom-4 right-4 z-20 p-2 rounded-full text-white transition-all shadow-lg"
              style={{
                background: 'rgba(11, 15, 13, 0.85)',
                border: '1px solid var(--ad-border)',
              }}
              aria-label={heroVideoPlaying ? "Pause video" : "Play video"}
            >
              {heroVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — THE 5-STAGE VALUE CHAIN (Framer Motion Slider)
          ============================================================ */}
      <section id="farm-gallery-section">
        <ValueChainSlider onNavigate={onNavigate} />
      </section>

      {/* ============================================================
          SECTION 3 — SUPPLY CHAIN CINEMATIC JOURNEY
          ============================================================ */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--ad-cool)' }}
            >
              Transit & Cold Chain Traceability
            </span>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight mt-1"
              style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
            >
              Continuous Supply Chain Journey
            </h2>
          </div>
        </div>

        <div
          className="relative overflow-hidden aspect-video max-h-[400px] w-full shadow-lg cursor-pointer group"
          style={{
            borderRadius: 'var(--ad-radius-xl)',
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border)',
          }}
          onClick={toggleJourneyVideo}
        >
          <video
            ref={journeyVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/assets/agridirect-farmer-harvest.webp.png"
            className="w-full h-full object-cover"
          >
            <source src="/assets/agridirect-supply-chain-journey.mp4" type="video/mp4" />
            <source src="/assets/AgriDirect_supply_chain_video_pr._202608280027.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, var(--ad-bg) 0%, transparent 40%)'
          }} />

          {/* Overlay Step Badges — Color-coded, not monotone */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-10 flex items-center justify-between overflow-x-auto pb-1 gap-2 pointer-events-none">
            {[
              { step: '01', label: 'Grow', color: 'var(--ad-brand-bright)' },
              { step: '02', label: 'Harvest', color: 'var(--ad-brand-bright)' },
              { step: '03', label: 'Collect', color: 'var(--ad-accent)' },
              { step: '04', label: 'Predict', color: 'var(--ad-cool-bright)' },
              { step: '05', label: 'Decide', color: 'var(--ad-accent)' },
              { step: '06', label: 'Move', color: 'var(--ad-cool-bright)' },
              { step: '07', label: 'Settle', color: 'var(--ad-brand-bright)' },
            ].map((st) => (
              <div
                key={st.step}
                className="px-3 py-1.5 rounded-lg shrink-0 text-[11px] font-bold"
                style={{
                  background: 'rgba(11, 15, 13, 0.88)',
                  border: '1px solid var(--ad-border)',
                  color: st.color,
                  fontFamily: 'var(--ad-font-display)',
                }}
              >
                <span style={{ opacity: 0.6 }}>{st.step}.</span> {st.label}
              </div>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleJourneyVideo();
            }}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-white transition-all shadow-lg"
            style={{
              background: 'rgba(11, 15, 13, 0.85)',
              border: '1px solid var(--ad-border)',
            }}
            aria-label={journeyVideoPlaying ? "Pause video" : "Play video"}
          >
            {journeyVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — VALUE REALIZATION COMPARISON
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fragmented Chain — Danger accent */}
        <div
          className="p-6 space-y-4"
          style={{
            borderRadius: 'var(--ad-radius-lg)',
            background: 'var(--ad-surface-0)',
            border: '1px solid rgba(184, 42, 42, 0.2)',
            borderLeft: '3px solid var(--ad-danger)',
          }}
        >
          <div className="flex items-center space-x-2 font-bold text-sm" style={{ color: 'var(--ad-danger-text)' }}>
            <AlertTriangle className="w-4 h-4" />
            <span>Traditional Fragmented Chain</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>3–5 intermediary middlemen</p>
          <div className="space-y-2 text-xs">
            <div
              className="p-3 rounded-lg flex justify-between items-center"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <span style={{ color: 'var(--ad-text-secondary)' }}>Farmer Farmgate Realization</span>
              <strong style={{ color: 'var(--ad-danger-text)', fontFamily: 'var(--ad-font-display)' }}>₹21.00/kg (30%)</strong>
            </div>
            <div className="text-center text-[10px] py-1" style={{ color: 'var(--ad-text-muted)' }}>
              ↓ Trader Margin (8%) + Wholesaler (10%) + Broker (12%)
            </div>
            <div
              className="p-3 rounded-lg flex justify-between items-center"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <span style={{ color: 'var(--ad-text-secondary)' }}>Urban Consumer Retail</span>
              <strong style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>₹70.00/kg (100%)</strong>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ad-text-muted)' }}>
            Uncoordinated distress selling and physical mandi handling losses erode farmer margins.
          </p>
        </div>

        {/* AgriDirect Chain — Gold accent */}
        <div
          className="p-6 space-y-4"
          style={{
            borderRadius: 'var(--ad-radius-lg)',
            background: 'linear-gradient(135deg, var(--ad-surface-0) 0%, var(--ad-surface-1) 100%)',
            border: '1px solid var(--ad-border-accent)',
            borderLeft: '3px solid var(--ad-accent)',
            boxShadow: 'var(--ad-shadow-glow-accent)',
          }}
        >
          <div className="flex items-center space-x-2 font-bold text-sm" style={{ color: 'var(--ad-accent)' }}>
            <ShieldCheck className="w-4 h-4" />
            <span>AgriDirect Direct Trade Ecosystem</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>Zero intermediaries, direct producer-to-buyer</p>
          <div className="space-y-2 text-xs">
            <div
              className="p-3 rounded-lg flex justify-between items-center"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <span style={{ color: 'var(--ad-text-secondary)' }}>Farmer Direct Payout</span>
              <strong style={{ color: 'var(--ad-brand-bright)', fontFamily: 'var(--ad-font-display)' }}>₹32.50/kg (+55%)</strong>
            </div>
            <div className="text-center text-[10px] py-1" style={{ color: 'var(--ad-accent)', opacity: 0.7 }}>
              ↓ Direct Trade + 2-Opt Pooled Logistics + 14-Day Optimization
            </div>
            <div
              className="p-3 rounded-lg flex justify-between items-center"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <span style={{ color: 'var(--ad-text-secondary)' }}>Verified Buyer Landed Cost</span>
              <strong style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>₹45.00/kg (35% Net Savings)</strong>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ad-text-muted)' }}>
            Direct offtake and zero broker cess capture mutual value for producer and buyer.
          </p>
        </div>
      </section>
    </div>
  );
};
