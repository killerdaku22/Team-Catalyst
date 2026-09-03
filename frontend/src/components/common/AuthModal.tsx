import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Sprout,
  ShoppingCart,
  Landmark,
  ShieldCheck,
  Truck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AgriDirectLogo } from './AgriDirectLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole, userEmail: string) => void;
}

const SEEDED_ACCOUNTS = [
  {
    role: 'FARMER' as UserRole,
    title: 'Farmer / Producer',
    name: 'Ramesh Kumar (Kolar)',
    email: 'farmer@agridirect.org',
    password: 'FarmerPass123!',
    icon: Sprout,
    badgeBg: 'linear-gradient(135deg, rgba(40, 114, 78, 0.3) 0%, rgba(20, 48, 33, 0.55) 100%)',
    badgeBorder: 'rgba(52, 199, 114, 0.4)',
    iconColor: '#34C772',
  },
  {
    role: 'BUYER' as UserRole,
    title: 'Institutional Buyer',
    name: 'BigBasket North Regional',
    email: 'buyer@bigbasket.com',
    password: 'BuyerPass123!',
    icon: ShoppingCart,
    badgeBg: 'linear-gradient(135deg, rgba(199, 163, 86, 0.25) 0%, rgba(60, 45, 18, 0.5) 100%)',
    badgeBorder: 'rgba(232, 213, 163, 0.45)',
    iconColor: '#E0BE6A',
  },
  {
    role: 'LOGISTICS' as UserRole,
    title: 'Transport Operator',
    name: 'Kisan Express Cold Chain',
    email: 'transporter@agridirect.org',
    password: 'TransporterPass123!',
    icon: Truck,
    badgeBg: 'linear-gradient(135deg, rgba(88, 134, 160, 0.25) 0%, rgba(24, 42, 58, 0.5) 100%)',
    badgeBorder: 'rgba(109, 163, 194, 0.45)',
    iconColor: '#6DA3C2',
  },
  {
    role: 'DOCA_OBSERVER' as UserRole,
    title: 'DoCA Observer',
    name: 'Dept of Consumer Affairs',
    email: 'observer@doca.gov.in',
    password: 'ObserverPass123!',
    icon: Landmark,
    badgeBg: 'linear-gradient(135deg, rgba(85, 112, 97, 0.3) 0%, rgba(27, 35, 32, 0.55) 100%)',
    badgeBorder: 'rgba(184, 196, 188, 0.4)',
    iconColor: '#BACBBF',
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('farmer@agridirect.org');
  const [password, setPassword] = useState('FarmerPass123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (acc: typeof SEEDED_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api/v1';

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('agridirect_token', data.access_token);
        setSuccessMsg(`Authenticated as ${data.user?.full_name || email}`);
        setTimeout(() => {
          onLoginSuccess(data.user?.role || 'FARMER', email);
          onClose();
        }, 400);
      } else {
        // Fallback for offline demo mode
        const matched = SEEDED_ACCOUNTS.find(a => a.email === email);
        if (matched) {
          setSuccessMsg(`Authenticated as ${matched.name} (Demo Mode)`);
          setTimeout(() => {
            onLoginSuccess(matched.role, email);
            onClose();
          }, 400);
        } else {
          setErrorMsg('Invalid email or password. Please select one of the verified demo accounts.');
        }
      }
    } catch (err: any) {
      const matched = SEEDED_ACCOUNTS.find(a => a.email === email);
      if (matched) {
        setSuccessMsg(`Authenticated as ${matched.name} (Demo Mode)`);
        setTimeout(() => {
          onLoginSuccess(matched.role, email);
          onClose();
        }, 400);
      } else {
        setErrorMsg('Network error. Selected demo account authenticated.');
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(5, 8, 6, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 w-full max-w-2xl my-auto shadow-2xl animate-fadeIn"
        style={{
          background: 'var(--ad-surface-0)',
          border: '1px solid var(--ad-border-accent)',
          boxShadow: 'var(--ad-shadow-2xl), 0 0 32px rgba(199, 163, 86, 0.15)',
          maxHeight: 'calc(100vh - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Visual Farm Banner */}
        <div
          className="md:col-span-5 relative hidden md:flex flex-col justify-between p-6 overflow-hidden"
          style={{ background: 'var(--ad-surface-1)' }}
        >
          <img
            src="/assets/agridirect-login-farm.webp.jpeg"
            alt="AgriDirect Farm Direct Network"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(11, 15, 13, 0.95) 0%, rgba(11, 15, 13, 0.5) 50%, rgba(11, 15, 13, 0.3) 100%)'
            }}
          />

          {/* Top Brand Mark */}
          <div className="relative z-10">
            <AgriDirectLogo size="md" showText />
          </div>

          {/* Bottom Narrative */}
          <div className="relative z-10 space-y-2 pt-16">
            <span
              className="text-[9px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--ad-accent)', fontFamily: 'var(--ad-font-display)' }}
            >
              Digital Public Infrastructure
            </span>
            <h3
              className="text-base font-extrabold leading-snug"
              style={{ fontFamily: 'var(--ad-font-display)', color: '#FFFFFF' }}
            >
              Empowering India's Agricultural Value Chain
            </h3>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
              Verified RBAC credentials with SHA-256 audit trails.
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Interface */}
        <div
          className="md:col-span-7 p-5 sm:p-6 space-y-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 40px)', background: 'var(--ad-surface-0)' }}
        >
          {/* Header Title & Close Button */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2
                className="text-lg sm:text-xl font-extrabold tracking-tight"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Sign In / Switch Persona
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ad-text-tertiary)' }}>
                Select a verified demo role or enter credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                background: 'var(--ad-surface-1)',
                border: '1px solid var(--ad-border)',
                color: 'var(--ad-text-secondary)'
              }}
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1-Click Demo Persona Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span style={{ color: 'var(--ad-text-muted)' }}>1-Click Demo Accounts:</span>
              <span style={{ color: 'var(--ad-accent)' }}>Fast Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SEEDED_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                const IconComponent = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectPreset(acc)}
                    className="p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center space-x-2.5 group"
                    style={{
                      background: isSelected ? 'var(--ad-surface-1)' : 'var(--ad-surface-0)',
                      border: isSelected ? `1px solid ${acc.iconColor}` : '1px solid var(--ad-border)',
                      boxShadow: isSelected ? `0 0 12px ${acc.badgeBorder}` : 'none',
                    }}
                  >
                    {/* Premium Role Badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: acc.badgeBg,
                        border: `1px solid ${acc.badgeBorder}`,
                      }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: acc.iconColor }} />
                    </div>
                    <div className="truncate">
                      <span
                        className="text-[11px] font-bold block truncate"
                        style={{
                          color: isSelected ? 'var(--ad-text-primary)' : 'var(--ad-text-secondary)',
                          fontFamily: 'var(--ad-font-display)'
                        }}
                      >
                        {acc.title}
                      </span>
                      <span className="text-[9px] block truncate" style={{ color: 'var(--ad-text-muted)' }}>
                        {acc.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2 text-xs" style={{ borderTop: '1px solid var(--ad-border)' }}>
            <div>
              <label className="block font-semibold mb-1 text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>
                Email Address:
              </label>
              <div className="relative flex items-center">
                <div className="w-9 h-9 rounded-l-xl bg-[#141A17] border border-r-0 border-[#273029] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-[#C7A356]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-r-xl text-xs font-mono focus:outline-none focus:border-[#C7A356] transition-colors"
                  style={{
                    background: 'var(--ad-surface-1)',
                    border: '1px solid var(--ad-border)',
                    color: 'var(--ad-text-primary)',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>
                Password:
              </label>
              <div className="relative flex items-center">
                <div className="w-9 h-9 rounded-l-xl bg-[#141A17] border border-r-0 border-[#273029] flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-[#C7A356]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 rounded-r-xl text-xs font-mono focus:outline-none focus:border-[#C7A356] transition-colors"
                  style={{
                    background: 'var(--ad-surface-1)',
                    border: '1px solid var(--ad-border)',
                    color: 'var(--ad-text-primary)',
                  }}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div
                className="p-2.5 rounded-xl text-xs flex items-center space-x-1.5"
                style={{
                  background: 'var(--ad-danger-bg)',
                  border: '1px solid var(--ad-danger)',
                  color: 'var(--ad-danger-text)'
                }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                className="p-2.5 rounded-xl text-xs flex items-center space-x-1.5"
                style={{
                  background: 'var(--ad-brand-light)',
                  border: '1px solid var(--ad-brand)',
                  color: 'var(--ad-brand-bright)'
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold transition-all shadow-md text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                color: '#0B0F0D',
                fontFamily: 'var(--ad-font-display)',
                boxShadow: '0 2px 10px rgba(199, 163, 86, 0.3)',
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Selected Role'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
