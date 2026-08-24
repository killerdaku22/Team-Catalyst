import React from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: string;
  /** Whether this is a numeric (right-aligned, monospace) column */
  numeric?: boolean;
  /** Custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
  /** Column width hint */
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T, index: number) => string | number;
  /** Optional empty state message */
  emptyMessage?: string;
  className?: string;
  /** Optional: make rows clickable */
  onRowClick?: (row: T, index: number) => void;
  /** Optional: highlight active row */
  activeRowKey?: string | number | null;
  /** Screen reader caption for the table */
  caption?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  activeRowKey,
  caption,
}: DataTableProps<T>) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="ad-table" role="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(col.numeric && 'ad-col-numeric')}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8"
                style={{ color: 'var(--ad-text-tertiary)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = rowKey(row, idx);
              const isActive = activeRowKey != null && key === activeRowKey;

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                  className={clsx(
                    onRowClick && 'cursor-pointer',
                    isActive && 'bg-ad-green-50'
                  )}
                  style={isActive ? { background: 'var(--ad-green-50)' } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row, idx);
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={clsx(col.numeric && 'ad-col-numeric')}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
