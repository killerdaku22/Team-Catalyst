import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  Layers,
  Sparkles
} from 'lucide-react';

interface StageData {
  stage: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  tag: string;
  targetTab: string;
  metrics: { label: string; value: string }[];
}

const VALUE_CHAIN_STAGES: StageData[] = [
  {
    stage: '01',
    title: 'Harvest & Precision Sorting',
    subtitle: 'Farmgate Quality Grading',
    desc: 'Farmers harvest produce at peak physiological maturity. Lots are cataloged with digital shelf-life indices, moisture baselines, and certified quality grades.',
    image: '/assets/agridirect-farmer-harvest.webp.png',
    tag: 'FARM LEVEL',
    targetTab: 'farmer',
    metrics: [
      { label: 'Farmgate Yield', value: 'Grade A 94%' },
      { label: 'Baseline Shelf-Life', value: '14 Days' }
    ]
  },
  {
    stage: '02',
    title: 'FPO Aggregation Hubs',
    subtitle: 'Cooperative Lot Pooling',
    desc: 'Local FPOs pool smallholder volumes into 10–20 tonne commercial lots with standardized legal metrology weighing and batch traceability.',
    image: '/assets/agridirect-fpo-collection.webp.png',
    tag: 'AGGREGATION',
    targetTab: 'farmer',
    metrics: [
      { label: 'Batch Scale', value: '15,000 kg' },
      { label: 'FPO Margin Uplift', value: '+₹4.20/kg' }
    ]
  },
  {
    stage: '03',
    title: 'Pooled Logistics & Route Optimization',
    subtitle: '2-Opt CVRP Shared Cold Transit',
    desc: 'Shared multi-stop refrigerated transport reduces freight cost by 38% and cuts food miles carbon footprint to 0.162 kg CO2/tonne-km.',
    image: '/assets/agridirect-smart-logistics.webp.png',
    tag: 'COLD TRANSIT',
    targetTab: 'logistics',
    metrics: [
      { label: 'Freight Savings', value: '38.2%' },
      { label: 'Transit Spoilage', value: '<1.2%' }
    ]
  },
  {
    stage: '04',
    title: 'Institutional Market Offtake',
    subtitle: 'Verified Direct Contracting',
    desc: 'Direct institutional contracting with major retailers (BigBasket, Reliance) ensures guaranteed off-take and zero middleman broker cess.',
    image: '/assets/agridirect-market-arrival.webp.png',
    tag: 'SETTLEMENT',
    targetTab: 'marketplace',
    metrics: [
      { label: 'Landed Cost Saving', value: '35%' },
      { label: 'Settlement Speed', value: 'T+24 Hours' }
    ]
  },
  {
    stage: '05',
    title: 'Pan-India Trade Network',
    subtitle: 'Spatial Price Equilibrium',
    desc: 'Real-time spatial price telemetry enables macro buffer stock optimization, preventing regional supply shocks and price inflation spikes.',
    image: '/assets/agridirect-india-trade-network.webp.png',
    tag: 'POLICY STABILITY',
    targetTab: 'ministry',
    metrics: [
      { label: 'National Coverage', value: '18 Hubs' },
      { label: 'Price Volatility', value: '-22%' }
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
      x: { type: 'spring' as const, stiffness: 300, damping: 30 },
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
      x: { type: 'spring' as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  })
};

export const ValueChainSlider: React.FC<ValueChainSliderProps> = ({ onNavigate }) => {
  const [[currentStage, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
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
    setPage(([prev]) => [index, index > prev ? 1 : -1]);
  };

  // Auto-play timer loop (6 seconds per slide)
  useEffect(() => {
    if (!isAutoPlaying || isHovered) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      paginate(1);
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [currentStage, isAutoPlaying, isHovered]);

  const activeStageData = VALUE_CHAIN_STAGES[currentStage];

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Bar: Section Title & Interactive Pill Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider block">
            Connected Produce Ecosystem
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            The 5-Stage Agricultural Value Chain
          </h2>
          <p className="text-xs text-[#8E9C93]">
            From harvest at the farm to multi-stop logistics and national trade stabilization.
          </p>
        </div>

        {/* Animated Top Pill Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
          {VALUE_CHAIN_STAGES.map((s, idx) => {
            const isActive = currentStage === idx;
            return (
              <button
                key={s.stage}
                onClick={() => goToStage(idx)}
                className={`relative px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-[#8E9C93] hover:text-white bg-[#1A221E] border border-[#2B3731]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeValueChainPill"
                    className="absolute inset-0 bg-[#2D6A4F] rounded-md -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span>{s.stage}. {s.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Slide Card with Directional Framer Motion Animation */}
      <div className="relative bg-[#1A221E] border border-[#2B3731] rounded-2xl overflow-hidden shadow-xl min-h-[380px] lg:min-h-[400px]">
        {/* Top Subtle Progress Indicator Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[#121815] z-30">
          <motion.div
            key={currentStage}
            initial={{ width: '0%' }}
            animate={{ width: isHovered ? undefined : '100%' }}
            transition={{ duration: 6, ease: 'linear' }}
            className="h-full bg-[#2D6A4F]"
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-7 items-center"
          >
            {/* Left Content Area (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="ad-badge ad-badge-sage text-[10px]">
                  {activeStageData.tag}
                </span>
                <span className="text-xs font-mono text-[#8E9C93]">
                  Stage {activeStageData.stage} of 05
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {activeStageData.title}
                </h3>
                <span className="text-xs text-[#52796F] font-semibold block mt-0.5">
                  {activeStageData.subtitle}
                </span>
              </div>

              <p className="text-xs text-[#C2CBC5] leading-relaxed">
                {activeStageData.desc}
              </p>

              {/* Stage Specific Key Metrics */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {activeStageData.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#121815] border border-[#1F2723]"
                  >
                    <span className="text-[10px] text-[#8E9C93] block">{m.label}</span>
                    <strong className="text-xs font-bold text-[#48BB78] mt-0.5 block">
                      {m.value}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  onClick={() => onNavigate(activeStageData.targetTab)}
                  className="ad-btn-primary text-xs"
                >
                  <span>Explore Live Operations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Image Frame with Subtle Vignette (6 Cols) */}
            <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-[#2B3731] aspect-[16/10] bg-[#121815] shadow-inner group">
              <img
                src={activeStageData.image}
                alt={activeStageData.title}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1412]/60 via-transparent to-transparent pointer-events-none" />

              {/* Bottom Right Image Tag Overlay */}
              <div className="absolute bottom-2.5 right-2.5 z-10 bg-[#121815]/90 backdrop-blur-sm border border-[#2B3731] px-2.5 py-1 rounded-md text-[10px] font-mono text-[#C2CBC5]">
                Stage {activeStageData.stage} • {activeStageData.tag}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Slide Navigation Controls (Prev / Next & Pause) */}
        <div className="absolute bottom-4 left-5 sm:left-7 z-20 flex items-center space-x-2">
          <button
            onClick={() => paginate(-1)}
            className="w-7 h-7 rounded-full bg-[#121815]/90 hover:bg-[#222C27] border border-[#2B3731] flex items-center justify-center text-[#C2CBC5] hover:text-white transition-all shadow"
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => paginate(1)}
            className="w-7 h-7 rounded-full bg-[#121815]/90 hover:bg-[#222C27] border border-[#2B3731] flex items-center justify-center text-[#C2CBC5] hover:text-white transition-all shadow"
            aria-label="Next stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="w-7 h-7 rounded-full bg-[#121815]/90 hover:bg-[#222C27] border border-[#2B3731] flex items-center justify-center text-[#8E9C93] hover:text-white transition-all shadow"
            title={isAutoPlaying ? "Pause auto-slider" : "Resume auto-slider"}
            aria-label={isAutoPlaying ? "Pause auto-slider" : "Resume auto-slider"}
          >
            {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Interactive Bottom Thumbnail Gallery Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {VALUE_CHAIN_STAGES.map((s, idx) => {
          const isSelected = currentStage === idx;
          return (
            <motion.div
              key={s.stage}
              onClick={() => goToStage(idx)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer rounded-lg overflow-hidden border transition-all ${
                isSelected
                  ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/40 shadow-md'
                  : 'border-[#2B3731] opacity-70 hover:opacity-100 bg-[#1A221E]'
              }`}
            >
              <div className="aspect-[16/10] bg-[#121815] overflow-hidden relative">
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute top-1.5 left-1.5 bg-[#2D6A4F] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                    Active
                  </div>
                )}
              </div>
              <div className="p-2 bg-[#1A221E] text-[11px]">
                <span className="font-bold text-white block truncate">{s.title}</span>
                <span className="text-[10px] text-[#8E9C93] block truncate">{s.subtitle}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
