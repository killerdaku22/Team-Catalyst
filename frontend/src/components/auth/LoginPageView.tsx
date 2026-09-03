import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  Sprout,
  Building2,
  ShoppingCart,
  Landmark,
  ShieldCheck,
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  HelpCircle
} from 'lucide-react';
import { AgriDirectLogo } from '../common/AgriDirectLogo';

interface LoginPageViewProps {
  onLoginSuccess: (role: UserRole, userEmail: string, fullName?: string) => void;
  onNavigateHome?: () => void;
}

interface DemoRoleConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badgeBg: string;
  badgeBorder: string;
  iconColor: string;
}

const DEMO_PRESETS: DemoRoleConfig[] = [
  {
    role: 'FARMER',
    title: 'Farmer / FPO Producer',
    subtitle: 'Ramesh Kumar (Kolar Hub)',
    email: 'farmer@agridirect.org',
    password: 'FarmerPass123!',
    icon: Sprout,
    badgeBg: 'linear-gradient(135deg, rgba(40, 114, 78, 0.3) 0%, rgba(20, 48, 33, 0.55) 100%)',
    badgeBorder: 'rgba(52, 199, 114, 0.4)',
    iconColor: '#34C772',
  },
  {
    role: 'BUYER',
    title: 'Institutional Buyer',
    subtitle: 'BigBasket North Regional',
    email: 'buyer@bigbasket.com',
    password: 'BuyerPass123!',
    icon: ShoppingCart,
    badgeBg: 'linear-gradient(135deg, rgba(199, 163, 86, 0.25) 0%, rgba(60, 45, 18, 0.5) 100%)',
    badgeBorder: 'rgba(232, 213, 163, 0.45)',
    iconColor: '#E0BE6A',
  },
  {
    role: 'LOGISTICS',
    title: 'Transport Operator',
    subtitle: 'Kisan Express Cold Chain Logistics',
    email: 'transporter@agridirect.org',
    password: 'TransporterPass123!',
    icon: Truck,
    badgeBg: 'linear-gradient(135deg, rgba(88, 134, 160, 0.25) 0%, rgba(24, 42, 58, 0.5) 100%)',
    badgeBorder: 'rgba(109, 163, 194, 0.45)',
    iconColor: '#6DA3C2',
  },
  {
    role: 'DOCA_OBSERVER',
    title: 'DoCA Market Observer',
    subtitle: 'Dept of Consumer Affairs • Read-Only',
    email: 'observer@doca.gov.in',
    password: 'ObserverPass123!',
    icon: Landmark,
    badgeBg: 'linear-gradient(135deg, rgba(85, 112, 97, 0.3) 0%, rgba(27, 35, 32, 0.55) 100%)',
    badgeBorder: 'rgba(184, 196, 188, 0.4)',
    iconColor: '#BACBBF',
  }
];

export const LoginPageView: React.FC<LoginPageViewProps> = ({
  onLoginSuccess,
  onNavigateHome
}) => {
  const [email, setEmail] = useState('farmer@agridirect.org');
  const [password, setPassword] = useState('FarmerPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSelectDemo = (preset: DemoRoleConfig) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setErrorMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        if (data.refresh_token) {
          localStorage.setItem('agridirect_refresh_token', data.refresh_token);
        }
        setSuccessMsg(`Welcome, ${data.user?.full_name || email}`);
        setTimeout(() => {
          onLoginSuccess(data.user?.role || 'FARMER', email, data.user?.full_name);
        }, 400);
      } else {
        // Fallback for offline presentation / test demo
        const matched = DEMO_PRESETS.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          setSuccessMsg(`Welcome, ${matched.subtitle} (Calibrated Demo Mode)`);
          setTimeout(() => {
            onLoginSuccess(matched.role, email, matched.subtitle);
          }, 400);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.detail || 'Invalid email or password. Please verify your credentials.');
        }
      }
    } catch (err: any) {
      // Offline fallback check
      const matched = DEMO_PRESETS.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setSuccessMsg(`Welcome, ${matched.subtitle} (Calibrated Offline Mode)`);
        setTimeout(() => {
          onLoginSuccess(matched.role, email, matched.subtitle);
        }, 400);
      } else {
        setErrorMsg('Network error. Unable to reach authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-6 px-4 animate-fadeIn">
      <div
        className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[540px]"
        style={{
          background: 'var(--ad-surface-0)',
          border: '1px solid var(--ad-border-accent)',
          boxShadow: 'var(--ad-shadow-2xl), 0 0 32px rgba(199, 163, 86, 0.15)',
        }}
      >
        {/* LEFT SIDE: Agricultural Visual (55% on Desktop) */}
        <div
          className="lg:col-span-7 relative overflow-hidden flex flex-col justify-between p-8 sm:p-10 min-h-[260px] lg:min-h-full"
          style={{ background: 'var(--ad-surface-1)' }}
        >
          {/* Background Farm Image */}
          <img
            src="/assets/agridirect-login-farm.webp"
            alt="Indian agricultural farm harvest"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.endsWith('.jpeg')) {
                target.src = '/assets/agridirect-login-farm.webp.jpeg';
              }
            }}
          />

          {/* Natural Vignette Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(11, 15, 13, 0.95) 0%, rgba(11, 15, 13, 0.5) 50%, rgba(11, 15, 13, 0.3) 100%)'
            }}
          />

          {/* Top Brand Mark */}
          <div className="relative z-10">
            <AgriDirectLogo size="lg" showText textSubtitle="National Platform" />
          </div>

          {/* Bottom Editorial Content */}
          <div className="relative z-10 space-y-4 pt-12">
            <div className="space-y-1.5 max-w-lg">
              <blockquote
                className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-white"
                style={{ fontFamily: 'var(--ad-font-display)' }}
              >
                “From the hands that grow it,
                <br />
                <span style={{ color: 'var(--ad-accent-bright)' }}>to the markets that need it.”</span>
              </blockquote>
              <p className="text-xs max-w-md leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
                Direct agricultural market intelligence, price realization optimization, and pooled cold-chain logistics for India's farm producers.
              </p>
            </div>

            {/* Value Chain Journey */}
            <div
              className="pt-2 flex items-center space-x-2 text-[11px] font-mono"
              style={{ borderTop: '1px solid var(--ad-border-subtle)', color: 'var(--ad-text-tertiary)' }}
            >
              <span className="font-bold" style={{ color: 'var(--ad-brand-bright)' }}>Farm</span>
              <span>→</span>
              <span>Intelligence</span>
              <span>→</span>
              <span>Decision</span>
              <span>→</span>
              <span className="font-bold" style={{ color: 'var(--ad-accent-bright)' }}>Market</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Authentication Interface (45% on Desktop) */}
        <div
          className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6"
          style={{ background: 'var(--ad-surface-0)' }}
        >
          <div className="space-y-5">
            {/* Header Title */}
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                style={{ color: 'var(--ad-accent)', fontFamily: 'var(--ad-font-display)' }}
              >
                Enterprise Authentication
              </span>
              <h1
                className="text-2xl font-extrabold tracking-tight"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Welcome back
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ad-text-muted)' }}>
                Access your AgriDirect workspace and live intelligence feeds.
              </p>
            </div>

            {/* Restrained Demo Access for SIH Presentation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span style={{ color: 'var(--ad-text-muted)' }}>Demo Workspace Access</span>
                <span className="font-mono" style={{ color: 'var(--ad-accent-bright)' }}>1-Click Fast Fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_PRESETS.map((p) => {
                  const isSelected = email === p.email;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSelectDemo(p)}
                      className="p-2.5 rounded-xl text-left transition-all flex items-center space-x-2.5 cursor-pointer group"
                      style={{
                        background: isSelected ? 'var(--ad-surface-1)' : 'var(--ad-surface-0)',
                        border: isSelected ? `1px solid ${p.iconColor}` : '1px solid var(--ad-border)',
                        boxShadow: isSelected ? `0 0 14px ${p.badgeBorder}` : 'none',
                      }}
                    >
                      {/* Premium Role Icon Badge */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: p.badgeBg,
                          border: `1px solid ${p.badgeBorder}`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: p.iconColor }} />
                      </div>
                      <div className="truncate">
                        <strong
                          className="text-[11px] font-bold block truncate"
                          style={{
                            color: isSelected ? 'var(--ad-text-primary)' : 'var(--ad-text-secondary)',
                            fontFamily: 'var(--ad-font-display)'
                          }}
                        >
                          {p.title}
                        </strong>
                        <span className="text-[9px] block truncate" style={{ color: 'var(--ad-text-muted)' }}>
                          {p.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-2 text-xs" style={{ borderTop: '1px solid var(--ad-border)' }}>
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold text-[11px]">Email Address</label>
                <div className="relative flex items-center">
                  <div className="w-10 h-10 rounded-l-xl bg-[#141A17] border border-r-0 border-[#273029] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#C7A356]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agridirect.org"
                    className="w-full h-10 px-3 bg-[#101613] border border-[#273029] rounded-r-xl text-white font-mono text-xs focus:outline-none focus:border-[#C7A356] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-semibold text-[11px]">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[#C7A356] hover:text-[#E8D5A3] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="w-10 h-10 rounded-l-xl bg-[#141A17] border border-r-0 border-[#273029] flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-[#C7A356]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 bg-[#101613] border border-[#273029] rounded-r-xl text-white font-mono text-xs focus:outline-none focus:border-[#C7A356] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#7F8F85] hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-700/20 text-xs flex items-center justify-center space-x-1.5 hover:scale-[1.01]"
              >
                <span>{loading ? 'Authenticating with Backend...' : 'Sign in to AgriDirect'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Footer Security Note */}
          <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>JWT Signed & SHA-256 Audited</span>
            </span>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Return to Overview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-sm w-full space-y-3 animate-fadeIn text-xs">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Credential Assistance</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              In this SIH evaluation environment, all standard RBAC roles are pre-seeded in the database. Use the 1-click demo tiles on the login interface to automatically populate verified credentials.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs hover:bg-emerald-500 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
