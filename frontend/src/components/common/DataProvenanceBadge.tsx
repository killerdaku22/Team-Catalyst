import React, { useState } from 'react';
import { ShieldCheck, Info, Database, Cpu, Compass, Clock, CheckCircle2 } from 'lucide-react';

export type ProvenanceType = 
  | 'LIVE_OBSERVED'
  | 'CACHED_BENCHMARK'
  | 'MODEL_INFERENCE'
  | 'REAL_ROAD_NETWORK'
  | 'ESTIMATED_HAVERSINE'
  | 'GOVT_BENCHMARK';

interface DataProvenanceBadgeProps {
  type: ProvenanceType;
  sourceText?: string;
  methodologyText?: string;
  timestamp?: string;
  className?: string;
  compact?: boolean;
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
  type,
  sourceText,
  methodologyText,
  timestamp = 'Updated real-time',
  className = '',
  compact = false,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  const configMap: Record<ProvenanceType, {
    label: string;
    sublabel: string;
    badgeBg: string;
    dotColor: string;
    icon: React.ReactNode;
    defaultSource: string;
    defaultMethod: string;
  }> = {
    LIVE_OBSERVED: {
      label: 'Agmarknet Live',
      sublabel: 'Observed APMC Market Price',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      dotColor: 'bg-emerald-400',
      icon: <Database className="w-3 h-3 text-emerald-400" />,
      defaultSource: 'Official Agmarknet (Data.gov.in) Market Feed',
      defaultMethod: 'Trimmed modal price with outlier IQR band correction (₹/kg).'
    },
    CACHED_BENCHMARK: {
      label: 'Agmarknet Benchmark',
      sublabel: 'Validated Ingestion Cache',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      dotColor: 'bg-amber-400',
      icon: <Database className="w-3 h-3 text-amber-400" />,
      defaultSource: 'Agmarknet Historical Ingestion Cache',
      defaultMethod: 'Time-decayed historical modal baseline with fallback resilience.'
    },
    MODEL_INFERENCE: {
      label: 'ML Forecast',
      sublabel: 'Ridge AR(7) + Weather Covariates',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      dotColor: 'bg-indigo-400',
      icon: <Cpu className="w-3 h-3 text-indigo-400" />,
      defaultSource: 'AgriDirect Multi-Model Forecasting Engine',
      defaultMethod: 'Walk-forward cross-validated auto-regressive model with Open-Meteo temperature covariates.'
    },
    REAL_ROAD_NETWORK: {
      label: 'OSRM Highway Corridor',
      sublabel: 'OpenStreetMap Turn-by-Turn',
      badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      dotColor: 'bg-blue-400',
      icon: <Compass className="w-3 h-3 text-blue-400" />,
      defaultSource: 'OpenStreetMap Road Network (OSRM Engine)',
      defaultMethod: 'Shortest path heavy-vehicle highway corridor routing.'
    },
    ESTIMATED_HAVERSINE: {
      label: 'Geodesic Estimate',
      sublabel: 'Great-Circle Haversine Formula',
      badgeBg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
      dotColor: 'bg-slate-400',
      icon: <Compass className="w-3 h-3 text-slate-400" />,
      defaultSource: 'Geographical Coordinates Calculation',
      defaultMethod: 'Haversine distance multiplied by 1.25x average Indian road curvature coefficient.'
    },
    GOVT_BENCHMARK: {
      label: 'DoCA Regulatory Feed',
      sublabel: 'Price Monitoring Division',
      badgeBg: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
      dotColor: 'bg-teal-400',
      icon: <ShieldCheck className="w-3 h-3 text-teal-400" />,
      defaultSource: 'Department of Consumer Affairs (DoCA) National Price Monitoring Cell',
      defaultMethod: 'National wholesale & retail buffer stock surveillance baseline.'
    }
  };

  const current = configMap[type] || configMap.LIVE_OBSERVED;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium tracking-wide transition-all hover:scale-105 ${current.badgeBg}`}
        aria-label="Data Provenance Details"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} animate-pulse`} />
        {current.icon}
        <span>{compact ? current.label : `${current.label} • Provenance`}</span>
        <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      </button>

      {showPopover && (
        <div
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          className="absolute z-50 left-0 top-full mt-1.5 w-72 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${current.dotColor}`} />
              <span className="text-xs font-semibold text-white tracking-tight">{current.label}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">
              PROVENANCE
            </span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Source</span>
              <span className="text-slate-200">{sourceText || current.defaultSource}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Methodology</span>
              <span className="text-slate-300 leading-relaxed">{methodologyText || current.defaultMethod}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {timestamp}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
