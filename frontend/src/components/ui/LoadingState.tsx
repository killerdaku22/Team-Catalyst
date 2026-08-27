import React from 'react';
import { clsx } from 'clsx';

/* --- Spinner --- */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Accessible label */
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading',
}) => {
  const sizeClass =
    size === 'sm' ? 'ad-loading-spinner--sm' :
    size === 'lg' ? 'ad-loading-spinner--lg' :
    '';

  return (
    <span
      className={clsx('ad-loading-spinner', sizeClass, className)}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
};

/* --- Skeleton --- */
interface SkeletonProps {
  /** Width as CSS value */
  width?: string;
  /** Height as CSS value */
  height?: string;
  /** Render as a circle */
  circle?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  circle = false,
  className,
}) => {
  return (
    <div
      className={clsx('ad-skeleton', className)}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : undefined,
      }}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
};

/* --- Contextual Card Skeleton --- */
export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 3, className }) => {
  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <Skeleton width="40%" height="18px" />
            <Skeleton width="20%" height="14px" circle />
          </div>
          <Skeleton width="70%" height="24px" />
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <Skeleton width="90%" height="12px" />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
};

/* --- Contextual Table Skeleton --- */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 animate-pulse">
      <div className="flex space-x-4 border-b border-slate-800 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100 / cols}%`} height="16px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2 border-b border-slate-800/40">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
};

/* --- Full Page Loading --- */
interface LoadingPageProps {
  message?: string;
  submessage?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading agricultural market data...',
  submessage = 'Connecting to real-time mandi feeds & analytics engine'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] gap-3 glass-panel rounded-3xl p-8 border border-slate-800 animate-fadeIn">
      <LoadingSpinner size="lg" label={message} />
      <div className="text-center space-y-1">
        <h4 className="font-extrabold text-white text-base">{message}</h4>
        <p className="text-xs text-slate-400 font-medium">{submessage}</p>
      </div>
    </div>
  );
};
