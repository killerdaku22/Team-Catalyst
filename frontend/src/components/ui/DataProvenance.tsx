import React from 'react';
import { clsx } from 'clsx';

export interface DataProvenanceProps {
  /** Data source name, e.g. "AGMARKNET / CEDA" */
  source: string;
  /** Last updated timestamp (formatted string) */
  updatedAt?: string;
  /** Whether data is simulated/synthetic */
  simulated?: boolean;
  className?: string;
}

export const DataProvenance: React.FC<DataProvenanceProps> = ({
  source,
  updatedAt,
  simulated = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'ad-provenance',
        simulated && 'ad-provenance--simulated',
        className
      )}
      title={simulated ? 'This data is from synthetic simulation' : `Source: ${source}`}
    >
      {simulated && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zM7.25 5v4h1.5V5h-1.5zm0 5v1.5h1.5V10h-1.5z" />
        </svg>
      )}
      <span>{simulated ? 'Simulated' : 'Source'}: {source}</span>
      {updatedAt && (
        <>
          <span className="ad-provenance__dot" aria-hidden="true" />
          <span>Updated: {updatedAt}</span>
        </>
      )}
    </span>
  );
};
