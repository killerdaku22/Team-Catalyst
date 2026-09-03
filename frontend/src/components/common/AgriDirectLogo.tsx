import React from 'react';

interface AgriDirectLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSubtitle?: string;
  className?: string;
  variant?: 'default' | 'light';
}

export const AgriDirectLogo: React.FC<AgriDirectLogoProps> = ({
  size = 'md',
  showText = false,
  textSubtitle = 'Agricultural Commerce',
  className = '',
  variant = 'default',
}) => {
  const sizeMap = {
    sm: { container: 'w-7 h-7 rounded-lg', svg: 18, text: 'text-sm', sub: 'text-[8px]' },
    md: { container: 'w-8 h-8 rounded-xl', svg: 20, text: 'text-base', sub: 'text-[9px]' },
    lg: { container: 'w-10 h-10 rounded-xl', svg: 24, text: 'text-lg', sub: 'text-[10px]' },
    xl: { container: 'w-12 h-12 rounded-2xl', svg: 28, text: 'text-xl', sub: 'text-xs' },
  };

  const dim = sizeMap[size];

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Premium Geometric Shield Emblem */}
      <div
        className={`${dim.container} shrink-0 relative flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105`}
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #1E4D34 0%, #112B1E 100%)'
            : 'linear-gradient(135deg, #1A402D 0%, #0F281B 100%)',
          border: '1px solid rgba(199, 163, 86, 0.4)',
          boxShadow: '0 2px 8px rgba(11, 15, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        }}
        aria-hidden="true"
      >
        {/* Subtle Ambient Radial Highlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle at 30% 25%, rgba(232, 213, 163, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Bespoke Real-Product Agricultural SVG Emblem */}
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Base Soil / Furrow Arc (Muted Sage Gold) */}
          <path
            d="M3.5 18.5C7 16.5 17 16.5 20.5 18.5"
            stroke="#C7A356"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Central Stem (Wheat Gold) */}
          <path
            d="M12 18V6.5"
            stroke="#E8D5A3"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Left Grain Leaf (Vibrant Emerald) */}
          <path
            d="M12 12.5C9.5 12.5 7.5 10.5 7.5 8C10 8 12 10 12 12.5Z"
            fill="url(#emeraldGrad)"
            stroke="#34C772"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Right Sprout Leaf (Wheat Gold Gradient) */}
          <path
            d="M12 9.5C14.5 9.5 16.5 7.5 16.5 5C14 5 12 7 12 9.5Z"
            fill="url(#goldGrad)"
            stroke="#E8D5A3"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Crown Apex Grain Head */}
          <circle
            cx="12"
            cy="4.5"
            r="1.2"
            fill="#FAF8F3"
            stroke="#C7A356"
            strokeWidth="0.8"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="emeraldGrad" x1="7.5" y1="8" x2="12" y2="12.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34C772" />
              <stop offset="1" stopColor="#1E4D34" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="12" y1="5" x2="16.5" y2="9.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAF8F3" />
              <stop offset="1" stopColor="#C7A356" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Optional Brand Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight leading-none ${dim.text}`}
            style={{
              color: isLight ? '#12281E' : '#F2F4F3',
              fontFamily: 'var(--ad-font-display, "DM Sans", sans-serif)',
            }}
          >
            Agri<span style={{ color: 'var(--ad-accent, #C7A356)' }}>Direct</span>
          </span>
          {textSubtitle && (
            <span
              className={`font-semibold tracking-wider uppercase block mt-0.5 ${dim.sub}`}
              style={{ color: isLight ? '#557061' : '#7F8F85' }}
            >
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
