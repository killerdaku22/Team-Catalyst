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
      aria-label="Loading"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
};


/* --- Full Page Loading --- */
interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading data…',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
      <LoadingSpinner size="lg" label={message} />
      <p className="text-ad-body-sm" style={{ color: 'var(--ad-text-tertiary)' }}>
        {message}
      </p>
    </div>
  );
};
