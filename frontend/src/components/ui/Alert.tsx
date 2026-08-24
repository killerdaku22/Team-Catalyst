import React from 'react';
import { clsx } from 'clsx';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Optional dismiss handler */
  onDismiss?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
  info:    'ad-alert--info',
  warning: 'ad-alert--warning',
  error:   'ad-alert--error',
  success: 'ad-alert--success',
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  info:    <Info className="ad-alert__icon" />,
  warning: <AlertTriangle className="ad-alert__icon" />,
  error:   <XCircle className="ad-alert__icon" />,
  success: <CheckCircle className="ad-alert__icon" />,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  onDismiss,
}) => {
  return (
    <div
      className={clsx('ad-alert', variantClasses[variant], className)}
      role="alert"
    >
      {variantIcons[variant]}
      <div className="flex-1 min-w-0">
        {title && <div className="ad-alert__title">{title}</div>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
          aria-label="Dismiss alert"
          style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer' }}
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
