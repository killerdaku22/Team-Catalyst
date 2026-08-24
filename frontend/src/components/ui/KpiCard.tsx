import React from 'react';
import { clsx } from 'clsx';
import { DataProvenance, type DataProvenanceProps } from './DataProvenance';

type ChangeDirection = 'positive' | 'negative' | 'neutral';

interface KpiCardProps {
  /** Short label above the metric */
  label: string;
  /** The primary metric value (formatted string) */
  value: string;
  /** Optional change description, e.g. "+28.4% vs intermediary" */
  change?: string;
  /** Direction of change for color coding */
  changeDirection?: ChangeDirection;
  /** Data provenance info */
  provenance?: DataProvenanceProps;
  className?: string;
}

const changeClasses: Record<ChangeDirection, string> = {
  positive: 'ad-kpi__change--positive',
  negative: 'ad-kpi__change--negative',
  neutral:  'ad-kpi__change--neutral',
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  change,
  changeDirection = 'neutral',
  provenance,
  className,
}) => {
  return (
    <div className={clsx('ad-card p-4', className)}>
      <div className="ad-kpi">
        <span className="ad-kpi__label">{label}</span>
        <span className="ad-kpi__value">{value}</span>
        {change && (
          <span className={clsx('ad-kpi__change', changeClasses[changeDirection])}>
            {changeDirection === 'positive' && '↑ '}
            {changeDirection === 'negative' && '↓ '}
            {change}
          </span>
        )}
      </div>
      {provenance && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--ad-border)' }}>
          <DataProvenance {...provenance} />
        </div>
      )}
    </div>
  );
};
