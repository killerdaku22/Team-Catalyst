import React, { useRef, useState, useEffect } from 'react';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause
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
    <div className="space-y-12 animate-fadeIn pb-8">
      {/* ============================================================
          SECTION 1 — HERO
          ============================================================ */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1A221E] border border-[#2B3731] shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between z-10 space-y-6">
            <div className="space-y-3.5">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#222C27] border border-[#2B3731] text-[#48BB78] text-xs font-semibold">
                <Sprout className="w-3.5 h-3.5" />
                <span>Agricultural Commerce & Market Intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                REAL FARMERS.<br />
                <span className="text-[#48BB78]">REAL MARKETS.</span><br />
                REAL IMPACT.
              </h1>

              <p className="text-xs sm:text-sm text-[#C2CBC5] max-w-lg font-normal leading-relaxed">
                Direct agricultural trade, 14-day price forecasting, and shared cold-chain logistics connecting producers with the markets that need them most.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('marketplace', 'BUYER')}
                className="ad-btn-primary px-5 py-2.5 text-xs shadow-md"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('farm-gallery-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ad-btn-secondary px-4 py-2.5 text-xs"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2B3731] text-[11px] text-[#8E9C93]">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>Direct FPO Trade</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>14-Day Forecasting</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>Pooled Logistics</span>
              </div>
            </div>
          </div>

          {/* Right Hero Video (Video A) */}
          <div
            className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden bg-[#121815] flex items-center justify-center cursor-pointer group"
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

            <div className="absolute inset-0 bg-gradient-to-r from-[#1A221E] via-[#1A221E]/30 to-transparent lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A221E] via-transparent to-transparent lg:hidden block" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleHeroVideo();
              }}
              className="absolute bottom-3 right-3 z-20 bg-[#121815]/90 hover:bg-[#1A221E] border border-[#2B3731] p-1.5 rounded-full text-white transition-all shadow"
              aria-label={heroVideoPlaying ? "Pause video" : "Play video"}
            >
              {heroVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
          SECTION 3 — SUPPLY CHAIN CINEMATIC JOURNEY (Video B)
          ============================================================ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider">
              Transit & Cold Chain Traceability
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              Continuous Supply Chain Journey
            </h2>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden bg-[#1A221E] border border-[#2B3731] aspect-video max-h-[380px] w-full shadow-lg cursor-pointer group"
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

          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1412] via-transparent to-transparent" />

          {/* Overlay Step Badges */}
          <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-10 flex items-center justify-between overflow-x-auto pb-1 text-[10px] font-mono text-[#C2CBC5] gap-1.5 pointer-events-none">
            {['01. GROW', '02. HARVEST', '03. COLLECT', '04. PREDICT', '05. DECIDE', '06. MOVE', '07. SETTLE'].map((st) => (
              <div key={st} className="bg-[#121815]/90 px-2.5 py-1 rounded-md border border-[#2B3731] shrink-0">
                <span className="text-[#48BB78] font-bold">{st}</span>
              </div>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleJourneyVideo();
            }}
            className="absolute top-3 right-3 z-20 bg-[#121815]/90 hover:bg-[#1A221E] border border-[#2B3731] p-1.5 rounded-full text-white transition-all shadow"
            aria-label={journeyVideoPlaying ? "Pause video" : "Play video"}
          >
            {journeyVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — VALUE REALIZATION COMPARISON
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fragmented Chain */}
        <div className="p-5 rounded-xl border border-[#991B1B]/30 bg-[#1A221E] space-y-3">
          <div className="flex items-center space-x-2 text-[#F56565] font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Traditional Fragmented Chain (3–5 Middlemen)</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono text-[#C2CBC5]">
            <div className="p-2.5 rounded-lg bg-[#121815] border border-[#1F2723] flex justify-between">
              <span>Farmer Farmgate Realization</span>
              <strong className="text-[#F56565]">₹21.00/kg (30%)</strong>
            </div>
            <div className="p-1.5 text-center text-[#8E9C93] text-[10px]">
              ↓ Trader Margin (8%) + Wholesaler (10%) + Secondary Broker (12%)
            </div>
            <div className="p-2.5 rounded-lg bg-[#121815] border border-[#1F2723] flex justify-between">
              <span>Urban Consumer Retail Price</span>
              <strong className="text-white">₹70.00/kg (100%)</strong>
            </div>
          </div>
          <p className="text-[11px] text-[#8E9C93]">
            Uncoordinated distress selling and physical mandi handling losses erode farmer margins.
          </p>
        </div>

        {/* AgriDirect Unified Chain */}
        <div className="p-5 rounded-xl border border-[#2D6A4F]/40 bg-[#1A221E] space-y-3">
          <div className="flex items-center space-x-2 text-[#48BB78] font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>AgriDirect Direct Trade Ecosystem</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono text-[#C2CBC5]">
            <div className="p-2.5 rounded-lg bg-[#121815] border border-[#1F2723] flex justify-between">
              <span>Farmer Direct Payout</span>
              <strong className="text-[#48BB78]">₹32.50/kg (+55% Uplift)</strong>
            </div>
            <div className="p-1.5 text-center text-[#52796F] text-[10px]">
              ↓ Direct Trade + 2-Opt Pooled Logistics + 14-Day Price Optimization
            </div>
            <div className="p-2.5 rounded-lg bg-[#121815] border border-[#1F2723] flex justify-between">
              <span>Verified Buyer Landed Cost</span>
              <strong className="text-white">₹45.00/kg (35% Net Savings)</strong>
            </div>
          </div>
          <p className="text-[11px] text-[#8E9C93]">
            Direct offtake and zero unnecessary broker cess capture mutual value for producer and buyer.
          </p>
        </div>
      </section>
    </div>
  );
};
