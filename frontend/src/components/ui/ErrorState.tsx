import React from 'react';
import { AlertTriangle, RefreshCw, Database, WifiOff, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onUseFallback?: () => void;
  lastSyncedTimestamp?: string;
  isOffline?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Stream Temporarily Unavailable',
  message = 'Unable to establish connection with external market telemetry. You may retry or inspect cached benchmark records.',
  onRetry,
  onUseFallback,
  lastSyncedTimestamp = 'Recently verified',
  isOffline = false,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'p-6 sm:p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900/60 backdrop-blur-sm text-center max-w-lg mx-auto my-6 animate-fadeIn',
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
        {isOffline ? <WifiOff className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 max-w-sm mx-auto">
        {message}
      </p>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono mb-6">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Last Cache Sync: {lastSyncedTimestamp}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Retry Live Stream</span>
          </button>
        )}

        {onUseFallback && (
          <button
            type="button"
            onClick={onUseFallback}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all hover:scale-105 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Benchmark Cache</span>
          </button>
        )}
      </div>
    </div>
  );
};
