/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- AgriDirect Enterprise Design Tokens ---
        // Backgrounds
        'ad-bg':          'var(--ad-bg)',
        'ad-bg-alt':      'var(--ad-bg-alt)',
        'ad-surface':     'var(--ad-surface)',

        // Borders
        'ad-border':       'var(--ad-border)',
        'ad-border-strong':'var(--ad-border-strong)',

        // Text
        'ad-text':         'var(--ad-text-primary)',
        'ad-text-secondary':'var(--ad-text-secondary)',
        'ad-text-tertiary':'var(--ad-text-tertiary)',

        // Brand green (restrained)
        'ad-green': {
          50:  'var(--ad-green-50)',
          100: 'var(--ad-green-100)',
          600: 'var(--ad-green-600)',
          700: 'var(--ad-green-700)',
        },

        // Semantic
        'ad-amber': {
          50:  'var(--ad-amber-50)',
          600: 'var(--ad-amber-600)',
        },
        'ad-red': {
          50:  'var(--ad-red-50)',
          600: 'var(--ad-red-600)',
        },
        'ad-blue': {
          50:  'var(--ad-blue-50)',
          600: 'var(--ad-blue-600)',
        },

        // Navigation
        'ad-nav-bg':     'var(--ad-nav-bg)',
        'ad-nav-border': 'var(--ad-nav-border)',

        // Locked Visual Identity Tokens (UI-01)
        'ad-ivory':      'var(--color-ivory)',
        'ad-forest':     'var(--color-forest)',
        'ad-sage':       'var(--color-sage)',
        'ad-gold':       'var(--color-gold)',
        'ad-green-brand':'var(--color-green)',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      fontSize: {
        'ad-display':    ['1.5rem',    { lineHeight: '2rem',     fontWeight: '700' }],
        'ad-heading':    ['1.125rem',  { lineHeight: '1.625rem', fontWeight: '600' }],
        'ad-subheading': ['0.875rem',  { lineHeight: '1.25rem',  fontWeight: '600' }],
        'ad-body':       ['0.875rem',  { lineHeight: '1.375rem', fontWeight: '400' }],
        'ad-body-sm':    ['0.8125rem', { lineHeight: '1.25rem',  fontWeight: '400' }],
        'ad-caption':    ['0.75rem',   { lineHeight: '1rem',     fontWeight: '500' }],
        'ad-overline':   ['0.6875rem', { lineHeight: '1rem',     fontWeight: '600', letterSpacing: '0.05em' }],
        'ad-mono':       ['0.8125rem', { lineHeight: '1.25rem',  fontWeight: '500' }],
      },

      borderRadius: {
        'ad-sm': '4px',
        'ad-md': '6px',
        'ad-lg': '8px',
      },

      boxShadow: {
        'ad-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'ad-md': '0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'ad-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },

      // Animations — keep minimal, enterprise-appropriate
      keyframes: {
        'ad-fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ad-slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'ad-slide-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'ad-fade-in':        'ad-fade-in 0.2s ease-out',
        'ad-slide-in-right': 'ad-slide-in-right 0.25s ease-out',
        'ad-slide-in-up':    'ad-slide-in-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
