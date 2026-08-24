import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  /** Optional dot indicator before text */
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'ad-badge--neutral',
  success: 'ad-badge--success',
  warning: 'ad-badge--warning',
  error:   'ad-badge--error',
  info:    'ad-badge--info',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
  dot = false,
}) => {
  return (
    <span className={clsx('ad-badge', variantClasses[variant], className)} role="status">
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: 'currentColor',
            opacity: 0.7,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
