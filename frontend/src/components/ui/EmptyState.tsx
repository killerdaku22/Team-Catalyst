import React from 'react';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** Custom icon (defaults to Inbox) */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={clsx('ad-empty-state', className)} role="status">
      <div className="ad-empty-state__icon" aria-hidden="true">
        {icon || <Inbox className="w-full h-full" />}
      </div>
      <div className="ad-empty-state__title">{title}</div>
      {description && (
        <p className="ad-empty-state__description">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
