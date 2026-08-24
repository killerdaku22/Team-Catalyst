import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional footer (action buttons) */
  footer?: React.ReactNode;
  /** Width override */
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    requestAnimationFrame(() => {
      const first = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="ad-drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="ad-drawer"
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ad-drawer__header">
          <h2 className="ad-drawer__title">{title}</h2>
          <button
            onClick={onClose}
            className="ad-btn ad-btn--ghost ad-btn--sm"
            aria-label="Close panel"
            style={{ padding: '4px' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="ad-drawer__body">{children}</div>
        {footer && <div className="ad-drawer__footer">{footer}</div>}
      </div>
    </>
  );
};
