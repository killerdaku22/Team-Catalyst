import React from 'react';
import { clsx } from 'clsx';

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
  className?: string;
}

const statusConfig: Record<ProvenanceStatus, { label: string; colorClass: string }> = {
  OBSERVED: { label: 'Observed', colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' },
  LIVE: { label: 'Live Mandi', colorClass: 'text-emerald-300 bg-emerald-950/40 border-emerald-700/60' },
  HISTORICAL: { label: 'Historical Record', colorClass: 'text-slate-300 bg-slate-900/60 border-slate-700/60' },
  MODEL_OUTPUT: { label: 'Model Output', colorClass: 'text-cyan-300 bg-cyan-950/40 border-cyan-800/60' },
  ESTIMATE: { label: 'Statistical Estimate', colorClass: 'text-sky-300 bg-sky-950/40 border-sky-800/60' },
  SIMULATION: { label: 'Policy Simulation', colorClass: 'text-amber-300 bg-amber-950/40 border-amber-800/60' },
  USER_PROVIDED: { label: 'User Stated', colorClass: 'text-purple-300 bg-purple-950/40 border-purple-800/60' },
};

export const DataProvenance: React.FC<DataProvenanceProps> = ({
  source,
  status,
  simulated = false,
  updatedAt,
  detail,
  className,
}) => {
  const effectiveStatus: ProvenanceStatus = status || (simulated ? 'SIMULATION' : 'OBSERVED');
  const config = statusConfig[effectiveStatus] || statusConfig.OBSERVED;

  return (
    <div
      className={clsx(
        'inline-flex items-center space-x-2 text-[11px] font-mono px-2 py-0.5 rounded-md border',
        config.colorClass,
        className
      )}
      title={`Data Provenance: ${config.label} | Source: ${source}`}
    >
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
      {detail && (
        <>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{detail}</span>
        </>
      )}
    </div>
  );
};
