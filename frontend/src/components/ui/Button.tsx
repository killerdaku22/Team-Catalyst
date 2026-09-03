import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state — disables button and shows spinner */
  loading?: boolean;
  /** Icon element to render before text */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'ad-btn--primary',
  secondary: 'ad-btn--secondary',
  accent:    'ad-btn--accent',
  ghost:     'ad-btn--ghost',
  danger:    'ad-btn--danger',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'ad-btn',
        variantClasses[variant],
        size === 'sm' && 'ad-btn--sm',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="ad-loading-spinner ad-loading-spinner--sm" aria-hidden="true" />
      ) : icon ? (
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
