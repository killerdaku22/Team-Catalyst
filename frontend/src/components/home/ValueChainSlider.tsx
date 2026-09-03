import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Award,
  Layers
} from 'lucide-react';

interface StageData {
  stage: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  tag: string;
  targetTab: string;
  tagColor: string;
  metrics: { label: string; value: string; color?: string }[];
}

const VALUE_CHAIN_STAGES: StageData[] = [
  {
    stage: '01',
    title: 'Harvest & Precision Sorting',
    subtitle: 'Farmgate Quality Grading',
    desc: 'Farmers harvest produce at peak physiological maturity. Lots are cataloged with digital shelf-life indices, moisture baselines, and certified quality grades.',
    image: '/assets/agridirect-farmer-harvest.webp.png',
    tag: 'FARM LEVEL',
    tagColor: 'var(--ad-brand-bright)',
    targetTab: 'farmer',
    metrics: [
      { label: 'Farmgate Yield', value: 'Grade A 94%', color: 'var(--ad-brand-bright)' },
      { label: 'Baseline Shelf-Life', value: '14 Days', color: 'var(--ad-accent-bright)' }
    ]
  },
  {
    stage: '02',
    title: 'FPO Aggregation Hubs',
    subtitle: 'Cooperative Lot Pooling',
    desc: 'Local FPOs pool smallholder volumes into 10–20 tonne commercial lots with standardized legal metrology weighing and batch traceability.',
    image: '/assets/agridirect-fpo-collection.webp.png',
    tag: 'AGGREGATION',
    tagColor: 'var(--ad-accent)',
    targetTab: 'farmer',
    metrics: [
      { label: 'Batch Scale', value: '15,000 kg', color: 'var(--ad-text-primary)' },
      { label: 'FPO Margin Uplift', value: '+₹4.20/kg', color: 'var(--ad-brand-bright)' }
    ]
  },
  {
    stage: '03',
    title: 'Pooled Logistics & Routing',
    subtitle: '2-Opt CVRP Shared Cold Transit',
    desc: 'Shared multi-stop refrigerated transport reduces freight cost by 38% and cuts food miles carbon footprint to 0.162 kg CO2/tonne-km.',
    image: '/assets/agridirect-smart-logistics.webp.png',
    tag: 'COLD TRANSIT',
    tagColor: 'var(--ad-cool-bright)',
    targetTab: 'logistics',
    metrics: [
      { label: 'Freight Savings', value: '38.2%', color: 'var(--ad-cool-bright)' },
      { label: 'Transit Spoilage', value: '<1.2%', color: 'var(--ad-brand-bright)' }
    ]
  },
  {
    stage: '04',
    title: 'Institutional Market Offtake',
    subtitle: 'Verified Direct Contracting',
    desc: 'Direct institutional contracting with major retailers (BigBasket, Reliance) ensures guaranteed off-take and zero middleman broker cess.',
    image: '/assets/agridirect-market-arrival.webp.png',
    tag: 'SETTLEMENT',
    tagColor: 'var(--ad-accent-bright)',
    targetTab: 'marketplace',
    metrics: [
      { label: 'Landed Cost Saving', value: '35%', color: 'var(--ad-accent-bright)' },
      { label: 'Settlement Speed', value: 'T+24 Hours', color: 'var(--ad-brand-bright)' }
    ]
  },
  {
    stage: '05',
    title: 'Pan-India Trade Network',
    subtitle: 'Spatial Price Equilibrium',
    desc: 'Real-time spatial price telemetry enables macro buffer stock optimization, preventing regional supply shocks and price inflation spikes.',
    image: '/assets/agridirect-india-trade-network.webp.png',
    tag: 'POLICY STABILITY',
    tagColor: 'var(--ad-cool-bright)',
    targetTab: 'ministry',
    metrics: [
      { label: 'National Coverage', value: '18 Hubs', color: 'var(--ad-cool-bright)' },
      { label: 'Price Volatility', value: '-22%', color: 'var(--ad-accent-bright)' }
    ]
  }
];

interface ValueChainSliderProps {
  onNavigate: (tabId: string, role?: string) => void;
}

const AUTO_ROTATE_INTERVAL_MS = 6000;

export const ValueChainSlider: React.FC<ValueChainSliderProps> = ({ onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  const stageCount = VALUE_CHAIN_STAGES.length;

  const nextStage = () => {
    setActiveIndex((prev) => (prev + 1) % stageCount);
  };

  const prevStage = () => {
    setActiveIndex((prev) => (prev - 1 + stageCount) % stageCount);
  };

  // Continuous auto-rotation, pauses when user hovers
  useEffect(() => {
    if (!isAutoPlaying || isHovered) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextStage();
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [activeIndex, isAutoPlaying, isHovered]);

  const activeData = VALUE_CHAIN_STAGES[activeIndex];

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header & Pill Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--ad-accent)', fontFamily: 'var(--ad-font-display)' }}
            >
              Connected Produce Ecosystem
            </span>
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'var(--ad-surface-1)', color: 'var(--ad-text-tertiary)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <RotateCw className="w-2.5 h-2.5 animate-spin" style={{ color: 'var(--ad-accent)' }} />
              <span>{isAutoPlaying && !isHovered ? 'Auto-Advancing' : 'Interactive Gallery'}</span>
            </span>
          </div>
          <h2
            className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1"
            style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
          >
            The 5-Stage Agricultural Value Chain
          </h2>
          <p className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>
            Hover or click any stage to expand. Real photographic corridors connecting farmgate harvest to pan-India market stabilization.
          </p>
        </div>

        {/* Top Controls: Pill Selectors & Play/Pause */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
          {VALUE_CHAIN_STAGES.map((s, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={s.stage}
                onClick={() => setActiveIndex(idx)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
                style={{
                  color: isActive ? '#0B0F0D' : 'var(--ad-text-tertiary)',
                  background: isActive ? 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)' : 'var(--ad-surface-0)',
                  border: isActive ? '1px solid var(--ad-accent)' : '1px solid var(--ad-border)',
                  boxShadow: isActive ? '0 2px 8px rgba(199, 163, 86, 0.25)' : 'none',
                  fontFamily: 'var(--ad-font-display)',
                }}
              >
                <span>{s.stage}. {s.title.split(' ')[0]}</span>
              </button>
            );
          })}

          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={prevStage}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-secondary)' }}
              title="Previous stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextStage}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-secondary)' }}
              title="Next stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-secondary)' }}
              title={isAutoPlaying ? "Pause auto-rotation" : "Resume auto-rotation"}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5 text-[var(--ad-accent)]" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EXPANDING ACCORDION IMAGE GALLERY (Inspired by Image_Slider_Animation_tcw)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row gap-3 h-auto md:h-[500px] lg:h-[540px] w-full">
        {VALUE_CHAIN_STAGES.map((stage, idx) => {
          const isActive = activeIndex === idx;

          return (
            <div
              key={stage.stage}
              onClick={() => setActiveIndex(idx)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group ${
                isActive
                  ? 'md:flex-[5] h-[440px] md:h-full'
                  : 'md:flex-[1] h-24 md:h-full hover:md:flex-[1.5]'
              }`}
              style={{
                border: isActive
                  ? '2px solid var(--ad-border-accent)'
                  : '1px solid var(--ad-border)',
                boxShadow: isActive
                  ? 'var(--ad-shadow-xl), var(--ad-shadow-glow-accent)'
                  : 'var(--ad-shadow-sm)',
                background: 'var(--ad-surface-0)',
              }}
            >
              {/* Background Photographic Layer */}
              <img
                src={stage.image}
                alt={stage.title}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                  isActive ? 'scale-105' : 'scale-100 group-hover:scale-105 opacity-60'
                }`}
              />

              {/* Dynamic Gradient Vignette */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: isActive
                    ? 'linear-gradient(to top, rgba(11, 15, 13, 0.96) 0%, rgba(11, 15, 13, 0.75) 45%, rgba(11, 15, 13, 0.3) 100%)'
                    : 'linear-gradient(to top, rgba(11, 15, 13, 0.9) 0%, rgba(11, 15, 13, 0.5) 100%)',
                }}
              />

              {/* Active Slide Full Content Presentation */}
              {isActive ? (
                <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-between text-white animate-fadeIn">
                  {/* Top Bar inside Active Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow"
                        style={{
                          background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                          color: '#0B0F0D',
                          fontFamily: 'var(--ad-font-display)'
                        }}
                      >
                        STAGE {stage.stage} OF 05
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          background: 'rgba(11, 15, 13, 0.7)',
                          color: stage.tagColor,
                          border: '1px solid var(--ad-border)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        {stage.tag}
                      </span>
                    </div>

                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: 'var(--ad-accent-bright)' }}
                    >
                      {stage.subtitle}
                    </span>
                  </div>

                  {/* Bottom Content Box inside Active Card */}
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <h3
                        className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                        style={{ fontFamily: 'var(--ad-font-display)', color: '#FFFFFF' }}
                      >
                        {stage.title}
                      </h3>
                      <p
                        className="text-xs sm:text-sm mt-2 leading-relaxed"
                        style={{ color: 'var(--ad-text-secondary)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                      >
                        {stage.desc}
                      </p>
                    </div>

                    {/* Metric Badges Strip */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {stage.metrics.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-3 rounded-xl backdrop-blur-md"
                          style={{
                            background: 'rgba(20, 26, 23, 0.85)',
                            border: '1px solid var(--ad-border)',
                            borderLeft: `3px solid ${m.color || 'var(--ad-accent)'}`
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--ad-text-muted)' }}>
                            {m.label}
                          </span>
                          <strong
                            className="text-base font-extrabold block mt-0.5"
                            style={{ color: m.color || 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}
                          >
                            {m.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {/* Action CTA Button */}
                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(stage.targetTab);
                        }}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #2D7A52 0%, #1F5C3D 100%)',
                          color: '#FFFFFF',
                          border: '1px solid rgba(52, 199, 114, 0.3)',
                          fontFamily: 'var(--ad-font-display)'
                        }}
                      >
                        <span>Explore Corridor Module</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[11px]" style={{ color: 'var(--ad-text-muted)' }}>
                        Live corridor telemetry active
                      </span>
                    </div>
                  </div>

                  {/* Active Slide Progress Line at Bottom */}
                  {isAutoPlaying && !isHovered && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                      <motion.div
                        key={`prog-${activeIndex}`}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTO_ROTATE_INTERVAL_MS / 1000, ease: 'linear' }}
                        className="h-full"
                        style={{ background: 'var(--ad-accent)' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Inactive Card: Vertical Rotated Label on Desktop / Compact Horizontal Pill on Mobile */
                <div className="relative z-10 h-full p-4 flex md:flex-col justify-between items-center text-white">
                  {/* Top Stage Indicator */}
                  <span
                    className="font-mono font-extrabold text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: 'rgba(20, 26, 23, 0.85)',
                      border: '1px solid var(--ad-border)',
                      color: 'var(--ad-accent-bright)',
                    }}
                  >
                    {stage.stage}
                  </span>

                  {/* Desktop Vertical Rotated Text */}
                  <div className="hidden md:flex flex-col items-center justify-center flex-1 my-auto">
                    <span
                      className="whitespace-nowrap font-bold text-xs tracking-wider uppercase"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        color: 'var(--ad-text-secondary)',
                        fontFamily: 'var(--ad-font-display)',
                      }}
                    >
                      {stage.title}
                    </span>
                  </div>

                  {/* Mobile Horizontal Label */}
                  <div className="md:hidden flex flex-col items-start flex-1 px-3">
                    <span className="font-bold text-xs" style={{ fontFamily: 'var(--ad-font-display)' }}>
                      {stage.title}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>
                      {stage.subtitle}
                    </span>
                  </div>

                  {/* Bottom Hover Hint */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(20, 26, 23, 0.85)', border: '1px solid var(--ad-border)' }}
                  >
                    <ArrowRight className="w-3 h-3 text-[var(--ad-accent)]" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
