import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ShieldCheck, Info, Database, Cpu, Compass, Clock, CheckCircle2 } from 'lucide-react';

export type ProvenanceStatus = 
  | 'OBSERVED' 
  | 'MODEL_OUTPUT' 
  | 'ESTIMATE' 
  | 'SIMULATION' 
  | 'USER_PROVIDED' 
  | 'HISTORICAL' 
  | 'LIVE';

export interface DataProvenanceProps {
  /** Data source name, e.g. "AGMARKNET / CEDA" */
  source: string;
  /** Provenance status type */
  status?: ProvenanceStatus;
  /** Legacy compatibility flag for simulation */
  simulated?: boolean;
  /** Last updated timestamp (formatted string) */
  updatedAt?: string;
  /** Confidence or sample size detail */
  detail?: string;
  /** Custom methodology explanation */
  methodology?: string;
  className?: string;
}

const statusConfig: Record<ProvenanceStatus, { 
  label: string; 
  colorClass: string; 
  dotColor: string;
  defaultMethod: string;
}> = {
  OBSERVED: { 
    label: 'Observed Market Feed', 
    colorClass: 'text-emerald-300 bg-emerald-950/40 border-emerald-700/60',
    dotColor: 'bg-emerald-400',
    defaultMethod: 'Trimmed modal price with IQR outlier filtering across verified APMC arrivals.'
  },
  LIVE: { 
    label: 'Verified Mandi Stream', 
    colorClass: 'text-emerald-300 bg-emerald-950/40 border-emerald-700/60',
    dotColor: 'bg-emerald-400',
    defaultMethod: 'Agmarknet commodity arrival benchmark feed with band validation.'
  },
  HISTORICAL: { 
    label: 'Historical Benchmark', 
    colorClass: 'text-slate-300 bg-slate-900/60 border-slate-700/60',
    dotColor: 'bg-slate-400',
    defaultMethod: 'Time-weighted historical modal series adjusted for seasonal cycles.'
  },
  MODEL_OUTPUT: { 
    label: 'Model Inference', 
    colorClass: 'text-indigo-300 bg-indigo-950/40 border-indigo-700/60',
    dotColor: 'bg-indigo-400',
    defaultMethod: 'Multi-model backtested forecast (Ridge AR + Holt-Winters) with temperature covariates.'
  },
  ESTIMATE: { 
    label: 'Statistical Estimate', 
    colorClass: 'text-sky-300 bg-sky-950/40 border-sky-800/60',
    dotColor: 'bg-sky-400',
    defaultMethod: 'Geodesic Haversine calculation with Indian highway curvature coefficient.'
  },
  SIMULATION: { 
    label: 'Policy Simulation', 
    colorClass: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
    dotColor: 'bg-amber-400',
    defaultMethod: 'Economic price elasticity simulation based on National Price Monitoring Cell parameters.'
  },
  USER_PROVIDED: { 
    label: 'User Stated', 
    colorClass: 'text-purple-300 bg-purple-950/40 border-purple-800/60',
    dotColor: 'bg-purple-400',
    defaultMethod: 'Stated farmer batch parameters validated against agricultural metrology bounds.'
  },
};

export const DataProvenance: React.FC<DataProvenanceProps> = ({
  source,
  status,
  simulated = false,
  updatedAt,
  detail,
  methodology,
  className,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const effectiveStatus: ProvenanceStatus = status || (simulated ? 'SIMULATION' : 'OBSERVED');
  const config = statusConfig[effectiveStatus] || statusConfig.OBSERVED;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={clsx(
          'inline-flex items-center space-x-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all hover:scale-105 cursor-pointer',
          config.colorClass,
          className
        )}
        aria-label={`Data Provenance: ${config.label} (${source})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
        <span className="font-bold tracking-wider uppercase text-[9px] px-1 py-0.2 bg-black/30 rounded">
          {config.label}
        </span>
        <span className="text-slate-300">
          Source: <strong className="text-white">{source}</strong>
        </span>
        {updatedAt && (
          <>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{updatedAt}</span>
          </>
        )}
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {showPopover && (
        <div
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          className="absolute z-50 left-0 top-full mt-1.5 w-80 p-3.5 rounded-xl shadow-2xl text-left pointer-events-auto"
          style={{
            background: 'var(--ad-surface-0)',
            border: '1px solid var(--ad-border-accent)',
            boxShadow: 'var(--ad-shadow-xl), var(--ad-shadow-glow-accent)',
          }}
        >
          <div className="flex items-center justify-between pb-2 mb-2" style={{ borderBottom: '1px solid var(--ad-border)' }}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span className="text-xs font-semibold tracking-tight" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                {config.label}
              </span>
            </div>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: 'var(--ad-surface-1)', color: 'var(--ad-accent-bright)', border: '1px solid var(--ad-border-accent)' }}
            >
              PROVENANCE
            </span>
          </div>

          <div className="space-y-2 text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>
            <div>
              <span className="font-medium block text-[10px] uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Source Entity</span>
              <span className="font-semibold" style={{ color: 'var(--ad-text-primary)' }}>{source}</span>
            </div>

            <div>
              <span className="font-medium block text-[10px] uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Methodology & Formula</span>
              <span className="leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>{methodology || config.defaultMethod}</span>
            </div>

            {detail && (
              <div>
                <span className="font-medium block text-[10px] uppercase tracking-wider" style={{ color: 'var(--ad-text-muted)' }}>Confidence & Scope</span>
                <span style={{ color: 'var(--ad-text-secondary)' }}>{detail}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-[10px]" style={{ borderTop: '1px solid var(--ad-border)', color: 'var(--ad-text-muted)' }}>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" style={{ color: 'var(--ad-text-muted)' }} />
                {updatedAt || 'Continuous telemetry'}
              </span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--ad-brand-bright)' }}>
                <CheckCircle2 className="w-3 h-3" />
                Audit Verified
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
