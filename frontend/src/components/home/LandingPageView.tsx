import React, { useRef, useState } from 'react';
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  Building,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  Calendar,
  BarChart3,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import { DataProvenance } from '../ui/DataProvenance';

interface LandingPageViewProps {
  onNavigate: (tabId: string, role?: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const [journeyVideoPlaying, setJourneyVideoPlaying] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const journeyVideoRef = useRef<HTMLVideoElement>(null);

  const toggleHeroVideo = () => {
    if (heroVideoRef.current) {
      if (heroVideoPlaying) {
        heroVideoRef.current.pause();
      } else {
        heroVideoRef.current.play();
      }
      setHeroVideoPlaying(!heroVideoPlaying);
    }
  };

  const toggleJourneyVideo = () => {
    if (journeyVideoRef.current) {
      if (journeyVideoPlaying) {
        journeyVideoRef.current.pause();
      } else {
        journeyVideoRef.current.play();
      }
      setJourneyVideoPlaying(!journeyVideoPlaying);
    }
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-12">
      {/* ============================================================
          SECTION 1 — HERO
          ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl glass-panel border border-slate-800/90 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between z-10 space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide">
                <Sprout className="w-3.5 h-3.5" />
                <span>Agricultural Commerce & Market Intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
                REAL FARMERS.<br />
                <span className="text-emerald-400">REAL MARKETS.</span><br />
                REAL IMPACT.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                Direct agricultural commerce, real-time market intelligence, and smarter logistics connecting producers with the markets that need them most.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('marketplace', 'BUYER')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-700/30 flex items-center space-x-2 hover:scale-[1.02]"
              >
                <span>Explore Market</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('farm-journey-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-5 py-3.5 rounded-xl text-sm transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-medium text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct FPO Marketplace</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Market Intelligence</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Smart Pooled Logistics</span>
              </div>
            </div>
          </div>

          {/* Right Hero Video (Video A) */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden bg-slate-950 flex items-center justify-center">
            <video
              ref={heroVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/assets/agridirect-farm-hero.webp.png"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            >
              <source src="/assets/Wheat_and_vegetable_fields_moving_202608280019.mp4" type="video/mp4" />
            </video>

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:hidden block" />

            {/* Video Controls Pill */}
            <button
              onClick={toggleHeroVideo}
              className="absolute bottom-4 right-4 z-20 bg-slate-950/70 hover:bg-slate-900 backdrop-blur-md border border-slate-800 p-2 rounded-full text-slate-300 hover:text-white transition-all shadow-md"
              aria-label={heroVideoPlaying ? "Pause hero video" : "Play hero video"}
            >
              {heroVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — THE FARM TO MARKET JOURNEY (Video B)
          ============================================================ */}
      <section id="farm-journey-section" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest">
            The Produce Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            FROM THE FARM TO THE MARKET
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A transparent, connected supply pipeline ensuring maximum farmer realization and minimal transit shrinkage.
          </p>
        </div>

        {/* Video B Cinematic Container */}
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 aspect-video max-h-[440px] w-full">
          <video
            ref={journeyVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/assets/agridirect-farmer-harvest.webp.png"
            className="w-full h-full object-cover"
          >
            <source src="/assets/AgriDirect_supply_chain_video_pr._202608280027.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Journey Steps Strip */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-10 flex items-center justify-between overflow-x-auto pb-1 text-[11px] font-mono text-slate-300 gap-2">
            {[
              { num: '01', title: 'GROW' },
              { num: '02', title: 'HARVEST' },
              { num: '03', title: 'COLLECT' },
              { num: '04', title: 'UNDERSTAND' },
              { num: '05', title: 'DECIDE' },
              { num: '06', title: 'MOVE' },
              { num: '07', title: 'SELL' },
            ].map((st, i) => (
              <div key={st.num} className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-1.5 shrink-0">
                <span className="text-emerald-400 font-bold">{st.num}</span>
                <span className="text-white font-semibold">{st.title}</span>
              </div>
            ))}
          </div>

          <button
            onClick={toggleJourneyVideo}
            className="absolute top-4 right-4 z-20 bg-slate-950/70 hover:bg-slate-900 backdrop-blur-md border border-slate-800 p-2 rounded-full text-slate-300 hover:text-white transition-all shadow-md"
            aria-label={journeyVideoPlaying ? "Pause journey video" : "Play journey video"}
          >
            {journeyVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — THE PROBLEM & THE AGRIDIRECT SOLUTION
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fragmented Traditional Chain */}
        <div className="glass-panel p-6 rounded-3xl border border-rose-900/30 bg-rose-950/10 space-y-4">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Traditional Fragmented Chain (3–5 Middlemen)</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
              <span>🌾 Farmer Farmgate Realization</span>
              <strong className="text-rose-400">₹21.00/kg (30%)</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 text-slate-500 text-center">
              ↓ Commission Agent (6-8%) + Primary Wholesaler (10%) + Secondary Broker (12%)
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
              <span>🏪 Urban Consumer Retail Price</span>
              <strong className="text-white">₹70.00/kg (100%)</strong>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Uncoordinated distress selling, non-transparent APMC deductions, and high transit spoilage cost farmers ₹2.4 Lakhs/annum per FPO.
          </p>
        </div>

        {/* AgriDirect Unified Decision Chain */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-800/40 bg-emerald-950/10 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>AgriDirect Direct Intelligence Ecosystem</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
              <span>🌾 Farmer Direct Payout</span>
              <strong className="text-emerald-400">₹32.50/kg (55% Uplift)</strong>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-300 text-center border border-emerald-800/30">
              ↓ AI Decision (Hold/Sell) + 2-Opt Pooled Logistics + Direct Institutional Offtake
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
              <span>🏪 Verified Buyer Landed Cost</span>
              <strong className="text-emerald-300">₹45.00/kg (35% Savings)</strong>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Direct institutional contracting, legal metrology quality inspection, and zero APMC cess capture value for both producer and buyer.
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — DECISION ENGINE SHOWCASE
          ============================================================ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              Core Economic Optimization
            </span>
            <h3 className="text-2xl font-black text-white mt-1">KNOW YOUR NEXT MOVE.</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Multi-action economic payoff matrices evaluating SELL_NOW vs STORE vs MOVE vs SPLIT based on real market trends.
            </p>
          </div>

          <button
            onClick={() => onNavigate('farmer', 'FPO')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shrink-0"
          >
            <span>Open Decision Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Example Batch Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px]">PRODUCE BATCH</span>
            <div className="font-bold text-white text-sm">Tomato (Hybrid S-12)</div>
            <div className="text-slate-400">5,000 kg • Kolar Hub</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 text-[10px]">CURRENT MANDI</span>
            <div className="font-bold text-amber-400 text-sm">₹26.00/kg</div>
            <div className="text-slate-400">14D Outlook: ₹34.50/kg</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 text-[10px]">CONSTRAINTS</span>
            <div className="font-bold text-white text-sm">Shelf Life: 10 Days</div>
            <div className="text-slate-400">Storage: ₹0.08/kg/day</div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 space-y-1">
            <span className="text-emerald-400 font-bold text-[10px]">RECOMMENDED ACTION</span>
            <div className="font-black text-emerald-300 text-sm">SPLIT (60% SELL / 40% HOLD)</div>
            <div className="text-[10px] text-slate-300">+₹18,839 Net Realization Uplift</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — BEST MARKET NET REALIZATION
          ============================================================ */}
      <section className="space-y-4">
        <div>
          <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
            Spatial Arbitrage & Transit Spoilage Math
          </span>
          <h3 className="text-2xl font-black text-white mt-1">THE HIGHEST PRICE ISN'T ALWAYS THE BEST MARKET.</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ranking candidate markets by Net Realization = Gross Price - Freight - Transit Spoilage - APMC Cess.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span className="font-bold text-white">Delhi Azadpur (1,920 km)</span>
              <span className="text-rose-400">High Transit Risk</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Gross Price:</span>
              <strong className="text-white">₹40.00/kg</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Freight + Spoilage:</span>
              <span>-₹8.50/kg</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-300">
              <span>Net Realization:</span>
              <span>₹31.50/kg</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span className="font-bold text-white">Mumbai Vashi (980 km)</span>
              <span className="text-amber-400">Medium Risk</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Gross Price:</span>
              <strong className="text-white">₹38.00/kg</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Freight + Spoilage:</span>
              <span>-₹4.80/kg</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-300">
              <span>Net Realization:</span>
              <span>₹33.20/kg</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/50 bg-emerald-950/20 space-y-2 relative">
            <div className="flex justify-between">
              <span className="font-bold text-emerald-300">Bengaluru Hub (68 km)</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">BEST NET</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Gross Price:</span>
              <strong className="text-white">₹36.00/kg</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Freight + Spoilage:</span>
              <span>-₹1.40/kg</span>
            </div>
            <div className="pt-2 border-t border-emerald-800/60 flex justify-between font-black text-emerald-400 text-sm">
              <span>Net Realization:</span>
              <span>₹34.60/kg</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — NATIONAL IMPACT STORY
          ============================================================ */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              National Market Stabilization
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">FROM EVERY FARM TO EVERY MARKET.</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Transforming agricultural trade corridors across India with real-time supply matching and strategic food security reserve buffer releases.
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => onNavigate('marketplace', 'BUYER')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-700/20"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => onNavigate('farmer', 'FPO')}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all"
              >
                Start Selling
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800">
            <img
              src="/assets/agridirect-india-trade-network.webp.png"
              alt="National Trade Network"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
