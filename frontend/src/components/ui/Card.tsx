import React from 'react';
import { clsx } from 'clsx';

/* --- Card Container --- */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional padding override. Default padding is applied via CardBody. */
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx('ad-card', className)}>
      {children}
    </div>
  );
};

/* --- Card Header --- */
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Right-aligned action area */
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className, action }) => {
  return (
    <div className={clsx('ad-card-header', className)}>
      {action ? (
        <div className="flex items-center justify-between">
          <div>{children}</div>
          <div className="flex items-center gap-2 flex-shrink-0">{action}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

/* --- Card Body --- */
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return (
    <div className={clsx('ad-card-body', className)}>
      {children}
    </div>
  );
};
