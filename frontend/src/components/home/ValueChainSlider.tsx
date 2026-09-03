import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  RotateCw
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
      { label: 'Baseline Shelf-Life', value: '14 Days', color: 'var(--ad-accent)' }
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
    title: 'Pooled Logistics & Route Optimization',
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
    tagColor: 'var(--ad-accent)',
    targetTab: 'marketplace',
    metrics: [
      { label: 'Landed Cost Saving', value: '35%', color: 'var(--ad-accent)' },
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
      { label: 'Price Volatility', value: '-22%', color: 'var(--ad-accent)' }
    ]
  }
];

interface ValueChainSliderProps {
  onNavigate: (tabId: string, role?: string) => void;
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 280, damping: 28 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: 'spring' as const, stiffness: 280, damping: 28 },
      opacity: { duration: 0.2 }
    }
  })
};

const AUTO_ROTATE_INTERVAL_MS = 5000;

export const ValueChainSlider: React.FC<ValueChainSliderProps> = ({ onNavigate }) => {
  const [[currentStage, direction], setPage] = useState<[number, number]>([0, 1]);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const autoPlayTimerRef = useRef<any>(null);

  const stageCount = VALUE_CHAIN_STAGES.length;

  const paginate = (newDirection: number) => {
    setPage(([prev]) => {
      let next = prev + newDirection;
      if (next < 0) next = stageCount - 1;
      if (next >= stageCount) next = 0;
      return [next, newDirection];
    });
  };

  const goToStage = (index: number) => {
    setPage(([prev]) => [index, index >= prev ? 1 : -1]);
  };

  // Continuous Auto-Rotation Loop
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      paginate(1);
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [currentStage, isAutoPlaying]);

  const activeStageData = VALUE_CHAIN_STAGES[currentStage];

  return (
    <div className="space-y-4">
      {/* Top Bar: Section Title & Interactive Pill Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--ad-accent)' }}>
              Connected Produce Ecosystem
            </span>
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'var(--ad-surface-1)', color: 'var(--ad-text-tertiary)', border: '1px solid var(--ad-border-subtle)' }}
            >
              <RotateCw className="w-2.5 h-2.5 animate-spin" style={{ color: 'var(--ad-accent)' }} />
              <span>Auto-Looping</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
            The 5-Stage Agricultural Value Chain
          </h2>
          <p className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>
            Continuous automated lifecycle connecting harvest at the farm to national trade stabilization.
          </p>
        </div>

        {/* Animated Top Pill Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
          {VALUE_CHAIN_STAGES.map((s, idx) => {
            const isActive = currentStage === idx;
            return (
              <button
                key={s.stage}
                onClick={() => goToStage(idx)}
                className="relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
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
        </div>
      </div>

      {/* Main Slide Card with Directional Framer Motion Animation */}
      <div
        className="relative overflow-hidden shadow-xl min-h-[380px] lg:min-h-[400px]"
        style={{
          background: 'var(--ad-surface-0)',
          border: '1px solid var(--ad-border)',
          borderRadius: 'var(--ad-radius-xl)',
        }}
      >
        {/* Top Smooth Continuous Progress Indicator Bar */}
        <div className="absolute top-0 inset-x-0 h-1 z-30" style={{ background: 'var(--ad-surface-muted)' }}>
          <motion.div
            key={currentStage}
            initial={{ width: '0%' }}
            animate={{ width: isAutoPlaying ? '100%' : '0%' }}
            transition={{ duration: AUTO_ROTATE_INTERVAL_MS / 1000, ease: 'linear' }}
            className="h-full"
            style={{ background: 'linear-gradient(90deg, var(--ad-brand), var(--ad-accent))' }}
          />
        </div>

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center"
          >
            {/* Left Content Area (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center space-x-2">
                <span
                  className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider"
                  style={{
                    background: 'var(--ad-surface-1)',
                    color: activeStageData.tagColor,
                    border: '1px solid var(--ad-border)',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  {activeStageData.tag}
                </span>
                <span className="text-xs" style={{ color: 'var(--ad-text-muted)' }}>
                  Stage {activeStageData.stage} of 05
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold leading-snug" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                  {activeStageData.title}
                </h3>
                <span className="text-xs font-semibold block mt-1" style={{ color: 'var(--ad-accent)' }}>
                  {activeStageData.subtitle}
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
                {activeStageData.desc}
              </p>

              {/* Stage Specific Key Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {activeStageData.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl"
                    style={{
                      background: 'var(--ad-surface-1)',
                      border: '1px solid var(--ad-border-subtle)',
                      borderLeft: `3px solid ${m.color || 'var(--ad-accent)'}`,
                    }}
                  >
                    <span className="text-[10px] block font-semibold" style={{ color: 'var(--ad-text-tertiary)' }}>{m.label}</span>
                    <strong
                      className="text-sm font-extrabold mt-0.5 block"
                      style={{ color: m.color || 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}
                    >
                      {m.value}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  onClick={() => onNavigate(activeStageData.targetTab)}
                  className="ad-btn-primary text-xs px-4 py-2.5"
                >
                  <span>Explore Live Operations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Image Frame with Subtle Vignette (6 Cols) */}
            <div
              className="lg:col-span-6 relative overflow-hidden aspect-[16/10] shadow-inner group"
              style={{
                borderRadius: 'var(--ad-radius-lg)',
                border: '1px solid var(--ad-border)',
                background: 'var(--ad-surface-muted)',
              }}
            >
              <img
                src={activeStageData.image}
                alt={activeStageData.title}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--ad-surface-0) 0%, transparent 40%)' }}
              />

              {/* Bottom Right Image Tag Overlay */}
              <div
                className="absolute bottom-3 right-3 z-10 px-3 py-1 rounded-md text-[10px] font-semibold"
                style={{
                  background: 'rgba(11, 15, 13, 0.85)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid var(--ad-border)',
                  color: 'var(--ad-text-secondary)',
                  fontFamily: 'var(--ad-font-display)'
                }}
              >
                Stage {activeStageData.stage} · {activeStageData.tag}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Slide Navigation Controls (Prev / Next & Play/Pause) */}
        <div className="absolute bottom-4 left-6 sm:left-8 z-20 flex items-center space-x-2">
          <button
            onClick={() => paginate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md"
            style={{
              background: 'rgba(20, 26, 23, 0.9)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-secondary)',
            }}
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => paginate(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md"
            style={{
              background: 'rgba(20, 26, 23, 0.9)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-secondary)',
            }}
            aria-label="Next stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md"
            style={{
              background: 'rgba(20, 26, 23, 0.9)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-tertiary)',
            }}
            title={isAutoPlaying ? "Pause auto-rotation" : "Resume auto-rotation"}
            aria-label={isAutoPlaying ? "Pause auto-rotation" : "Resume auto-rotation"}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" style={{ color: 'var(--ad-accent)' }} /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive Bottom Thumbnail Gallery Bar with Live Progress Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {VALUE_CHAIN_STAGES.map((s, idx) => {
          const isSelected = currentStage === idx;
          return (
            <motion.div
              key={s.stage}
              onClick={() => goToStage(idx)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer overflow-hidden transition-all relative"
              style={{
                borderRadius: 'var(--ad-radius-md)',
                border: isSelected ? '1px solid var(--ad-accent)' : '1px solid var(--ad-border)',
                boxShadow: isSelected ? '0 0 12px rgba(199, 163, 86, 0.2)' : 'none',
                background: 'var(--ad-surface-0)',
                opacity: isSelected ? 1 : 0.75,
              }}
            >
              <div className="aspect-[16/10] overflow-hidden relative" style={{ background: 'var(--ad-surface-muted)' }}>
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold shadow"
                    style={{
                      background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                      color: '#0B0F0D',
                      fontFamily: 'var(--ad-font-display)'
                    }}
                  >
                    Active
                  </div>
                )}

                {/* Thumbnail Progress Bar for Active Slide */}
                {isSelected && isAutoPlaying && (
                  <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: 'rgba(11, 15, 13, 0.8)' }}>
                    <motion.div
                      key={`thumb-${currentStage}`}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: AUTO_ROTATE_INTERVAL_MS / 1000, ease: 'linear' }}
                      className="h-full"
                      style={{ background: 'var(--ad-accent)' }}
                    />
                  </div>
                )}
              </div>
              <div className="p-2.5 text-[11px]" style={{ background: 'var(--ad-surface-0)' }}>
                <span className="font-bold block truncate" style={{ color: 'var(--ad-text-primary)', fontFamily: 'var(--ad-font-display)' }}>
                  {s.title}
                </span>
                <span className="text-[10px] block truncate mt-0.5" style={{ color: 'var(--ad-text-muted)' }}>
                  {s.subtitle}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
