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
  BarChart3,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ValueChainSlider } from './ValueChainSlider';

interface LandingPageViewProps {
  onNavigate: (tabId: string, role?: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const [heroMuted, setHeroMuted] = useState(true);
  const [journeyVideoPlaying, setJourneyVideoPlaying] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const journeyVideoRef = useRef<HTMLVideoElement>(null);

  // Guarantee browser muted autoplay compliance & respect prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (heroVideoRef.current) {
      heroVideoRef.current.muted = true;
      if (!prefersReducedMotion) {
        heroVideoRef.current.play().catch(() => setHeroVideoPlaying(false));
      } else {
        setHeroVideoPlaying(false);
      }
    }
    if (journeyVideoRef.current) {
      journeyVideoRef.current.muted = true;
      if (!prefersReducedMotion) {
        journeyVideoRef.current.play().catch(() => setJourneyVideoPlaying(false));
      } else {
        setJourneyVideoPlaying(false);
      }
    }
  }, []);

  const toggleHeroAudio = () => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = !heroVideoRef.current.muted;
      setHeroMuted(heroVideoRef.current.muted);
    }
  };

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
          SECTION 1 — HERO (Template B Cinematic 10-Sec Loop)
          ============================================================ */}
      <section
        className="relative overflow-hidden shadow-2xl rounded-2xl border"
        style={{
          borderColor: 'var(--ad-border, #273029)',
          backgroundColor: '#0B0F0D',
        }}
      >
        {/* Cinematic Background Video Layer */}
        <video
          ref={heroVideoRef}
          autoPlay
          loop
          muted={heroMuted}
          playsInline
          preload="auto"
          poster="/assets/agridirect-farm-hero.webp.png"
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/assets/agridirect-farm-hero-video.mp4" type="video/mp4" />
          <source src="/assets/Wheat_and_vegetable_fields_moving_202608280019.mp4" type="video/mp4" />
        </video>

        {/* Text Readability Gradient Overlays */}
        <div
          className="absolute inset-0 z-0 pointer-events-none hidden sm:block"
          style={{
            background: 'linear-gradient(90deg, rgba(11, 15, 13, 0.96) 0%, rgba(11, 15, 13, 0.88) 45%, rgba(11, 15, 13, 0.45) 75%, rgba(11, 15, 13, 0.25) 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none sm:hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(11, 15, 13, 0.96) 0%, rgba(11, 15, 13, 0.88) 60%, rgba(11, 15, 13, 0.5) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Foreground Content Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[500px] lg:min-h-[540px] p-6 sm:p-10 lg:p-12 items-center">
          
          {/* Left Content Column (Cols 1–8 on Desktop) */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-7">
            <div className="space-y-4">
              
              {/* Eyebrow Pill */}
              <div
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit"
                style={{
                  background: 'rgba(40, 114, 78, 0.16)',
                  border: '1px solid rgba(52, 199, 114, 0.3)',
                  color: '#34C772',
                }}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Powering India's Agri-Commerce Infrastructure</span>
              </div>

              {/* Main Headline */}
              <h1
                className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.08]"
                style={{
                  fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)',
                  color: '#F2F4F3',
                }}
              >
                Real Farmers.<br />
                <span style={{ color: 'var(--ad-accent, #C7A356)' }}>Real Markets.</span><br />
                Real Impact.
              </h1>

              {/* Subtext */}
              <p
                className="text-sm sm:text-base max-w-xl font-normal leading-relaxed text-[#B8C4BC]"
              >
                Direct trade, 14-day price forecasting, and shared cold-chain logistics connecting producers with the markets that need them most.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('marketplace', 'BUYER')}
                className="px-6 py-3 rounded-lg font-bold text-xs sm:text-sm text-white flex items-center space-x-2 transition-all duration-150 shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#28724E',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1F5C3D';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#28724E';
                }}
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('farm-gallery-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-lg font-semibold text-xs sm:text-sm text-[#F2F4F3] flex items-center space-x-2 transition-all duration-150 border border-[#273029] cursor-pointer"
                style={{
                  backgroundColor: 'rgba(20, 26, 23, 0.85)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(27, 35, 32, 0.95)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(20, 26, 23, 0.85)';
                }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>See How It Works</span>
              </button>
            </div>

            {/* 3 Core Value Pillars */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-2 border-t"
              style={{ borderColor: 'rgba(39, 48, 41, 0.8)' }}
            >
              <div className="flex items-start space-x-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#C7A356] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Direct FPO Trade</div>
                  <div className="text-[11px] text-[#7F8F85]">Transparent & Fair</div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 text-xs">
                <TrendingUp className="w-4 h-4 text-[#34C772] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">14-Day Forecasting</div>
                  <div className="text-[11px] text-[#7F8F85]">AI-Powered Insights</div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 text-xs">
                <Truck className="w-4 h-4 text-[#C7A356] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Pooled Logistics</div>
                  <div className="text-[11px] text-[#7F8F85]">Lower Cost, Higher Reach.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Floating Market Pulse Card (Cols 9–12 on Desktop) */}
          <div className="hidden lg:flex lg:col-span-4 justify-end items-center pr-2">
            <div
              className="p-5 rounded-xl border border-[#273029] space-y-3 w-[250px] shadow-2xl backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(20, 26, 23, 0.88)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white tracking-wide">Market Pulse</span>
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#34C772]/15 border border-[#34C772]/30 text-[10px] text-[#34C772] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C772] animate-pulse" />
                  <span>Live</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-[11px] text-[#7F8F85] font-medium">Tomato Price (₹/Quintal)</div>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="font-mono text-2xl font-bold text-white tracking-tight">₹1,245</span>
                  <span className="text-xs font-semibold text-[#34C772]">+3.2%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#273029] text-[11px] text-[#B8C4BC] flex items-center justify-between">
                <span>Nashik APMC</span>
                <span className="text-[10px] text-[#7F8F85]">Updated 2 min ago</span>
              </div>
            </div>
          </div>

        </div>

        {/* Ambient Video Mute Toggle */}
        <button
          onClick={toggleHeroAudio}
          className="absolute bottom-4 right-4 z-20 p-2 rounded-full text-[#B8C4BC] hover:text-white transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7A356] cursor-pointer"
          style={{
            backgroundColor: 'rgba(11, 15, 13, 0.8)',
            border: '1px solid #273029',
          }}
          aria-label={heroMuted ? "Unmute video audio" : "Mute video audio"}
          title={heroMuted ? "Unmute video audio" : "Mute video audio"}
        >
          {heroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
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
