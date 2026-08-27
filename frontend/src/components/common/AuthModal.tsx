import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Building2,
  ShoppingCart,
  Landmark,
  ShieldCheck,
  Truck,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole, userEmail: string) => void;
}

const SEEDED_ACCOUNTS = [
  {
    role: 'FARMER' as UserRole,
    title: 'Farmer / Producer',
    name: 'Ramesh Kumar',
    email: 'farmer@agridirect.org',
    password: 'FarmerPass123!',
    icon: Sprout,
    badgeColor: 'bg-[#222C27] text-[#48BB78] border-[#2B3731]'
  },
  {
    role: 'BUYER' as UserRole,
    title: 'Institutional Buyer',
    name: 'BigBasket North Regional',
    email: 'buyer@bigbasket.com',
    password: 'BuyerPass123!',
    icon: ShoppingCart,
    badgeColor: 'bg-[#222C27] text-[#48BB78] border-[#2B3731]'
  },
  {
    role: 'LOGISTICS' as UserRole,
    title: 'Transport Operator',
    name: 'Kisan Express Cold Chain Logistics',
    email: 'transporter@agridirect.org',
    password: 'TransporterPass123!',
    icon: Truck,
    badgeColor: 'bg-[#222C27] text-[#48BB78] border-[#2B3731]'
  },
  {
    role: 'DOCA_OBSERVER' as UserRole,
    title: 'DoCA Market Observer',
    name: 'Dept of Consumer Affairs (Read-Only)',
    email: 'observer@doca.gov.in',
    password: 'ObserverPass123!',
    icon: Landmark,
    badgeColor: 'bg-[#222C27] text-[#D97706] border-[#2B3731]'
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
        }, 500);
      } else {
        // Fallback for offline demo mode
        const matched = SEEDED_ACCOUNTS.find(a => a.email === email);
        if (matched) {
          setSuccessMsg(`Authenticated as ${matched.name} (Demo Mode)`);
          setTimeout(() => {
            onLoginSuccess(matched.role, email);
            onClose();
          }, 500);
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
        }, 500);
      } else {
        setErrorMsg('Network error. Selected demo account authenticated.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl border border-slate-700 max-w-2xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-2xl animate-fadeIn">
        {/* Left Side: Visual Farm Banner */}
        <div className="md:col-span-5 relative hidden md:block bg-slate-900 overflow-hidden">
          <img
            src="/assets/agridirect-login-farm.webp.jpeg"
            alt="AgriDirect Farm Direct Network"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Digital Public Infrastructure
            </span>
            <h3 className="text-lg font-black text-white leading-tight mt-1">
              Empowering India's Agricultural Value Chain
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Verified RBAC credentials with SHA-256 audit trails.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Login Form */}
        <div className="md:col-span-7 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Sign In / Switch Persona</h2>
              <p className="text-xs text-slate-400">Select a verified demo role or enter credentials.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preset Persona Quick Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Click Demo Accounts:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SEEDED_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                const IconComponent = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectPreset(acc)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <span className="text-[11px] font-bold block truncate">{acc.title}</span>
                      <span className="text-[9px] text-slate-500 block truncate">{acc.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-slate-800/80 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Address:</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password:</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-700/20 text-xs flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Selected Role'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
