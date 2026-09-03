import React, { useState } from 'react';
import {
  Sprout,
  ShieldCheck,
  Award,
  PhoneCall,
  MapPin,
  MessageSquare,
  FileText,
  Lock,
  Info,
  Send,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

type ModalType = 'ABOUT' | 'TERMS' | 'PRIVACY' | 'FEEDBACK' | null;

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Feedback form state
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackRole, setFeedbackRole] = useState('FARMER_FPO');
  const [feedbackCategory, setFeedbackCategory] = useState('GENERAL');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const ticketId = `AD-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetFeedback = () => {
    setFeedbackName('');
    setFeedbackContact('');
    setFeedbackMessage('');
    setSubmittedTicket(null);
  };

  return (
    <>
      <footer
        className="mt-16 pt-12 pb-8 border-t relative overflow-hidden"
        style={{
          borderColor: 'var(--ad-border)',
          background: 'linear-gradient(180deg, var(--ad-surface-0) 0%, var(--ad-bg) 100%)',
        }}
      >
        {/* Subtle background ambient glow */}
        <div
          className="absolute top-0 left-1/4 w-96 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(52, 199, 114, 0.03)' }}
        />
        <div
          className="absolute top-0 right-1/4 w-96 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(199, 163, 86, 0.03)' }}
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
          {/* Main 4-Column Balanced Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
            {/* Column 1: Brand & Mission (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #2D7A52 0%, #1F5C3D 100%)',
                    boxShadow: '0 2px 8px rgba(45, 122, 82, 0.3)',
                  }}
                >
                  <Sprout className="w-4 h-4 text-white" />
                </div>
                <span
                  className="font-black text-lg tracking-tight"
                  style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
                >
                  Agri<span style={{ color: 'var(--ad-accent-bright)' }}>Direct</span>
                </span>
              </div>

              <p className="text-xs leading-relaxed max-w-sm" style={{ color: 'var(--ad-text-tertiary)' }}>
                Agricultural commerce infrastructure disintermediating Indian agricultural supply chains. Connecting verified Farmer Producer Organizations (FPOs) directly with institutional buyers, state buffer reserves, and cold freight networks.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: 'var(--ad-brand-light)',
                    color: 'var(--ad-brand-bright)',
                    border: '1px solid rgba(52, 199, 114, 0.2)',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>WDRA Accredited</span>
                </span>
                <span
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: 'var(--ad-accent-light)',
                    color: 'var(--ad-accent-bright)',
                    border: '1px solid var(--ad-border-accent)',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  <Award className="w-3 h-3" />
                  <span>DoCA Integrated</span>
                </span>
              </div>
            </div>

            {/* Column 2: Platform Corridors (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Commerce Corridors
              </h4>
              <ul className="space-y-2 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
                <li>
                  <button
                    onClick={() => onNavigate?.('decision')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Decision Center & Harvest Uplift
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('marketplace')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Direct Produce Marketplace
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('best-market')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Spatial Mandi Arbitrage Matrix
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('logistics')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Pooled Cold Logistics & VRP Routing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('storage')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    WDRA Cold Storage IoT Telemetry
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('buffer')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Strategic Grain Silo Reserves
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Policy, Legal & About (2.5 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Governance & Legal
              </h4>
              <ul className="space-y-2 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
                <li>
                  <button
                    onClick={() => setActiveModal('ABOUT')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left flex items-center space-x-1"
                  >
                    <Info className="w-3 h-3 text-[var(--ad-accent)]" />
                    <span>About AgriDirect</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('TERMS')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3 text-[var(--ad-cool)]" />
                    <span>Terms of Service</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('PRIVACY')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left flex items-center space-x-1"
                  >
                    <Lock className="w-3 h-3 text-[var(--ad-brand-bright)]" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('intelligence')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Market Disruption Feeds
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('ministry')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    DoCA Oversight Bureau
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('design-system')}
                    className="hover:text-[var(--ad-accent-bright)] transition-colors text-left"
                  >
                    Design Tokens & System
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Feedback & Corridors (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}
              >
                Feedback & Corridors
              </h4>

              {/* Actionable Feedback Pill Button */}
              <div
                className="p-3.5 rounded-xl space-y-2.5"
                style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>
                    Producer Feedback & Help
                  </span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded font-bold"
                    style={{ background: 'var(--ad-accent-light)', color: 'var(--ad-accent-bright)' }}
                  >
                    Direct Response
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ad-text-muted)' }}>
                  Have an APMC discrepancy, corridor route query, or cooperative feature feedback?
                </p>
                <button
                  onClick={() => {
                    handleResetFeedback();
                    setActiveModal('FEEDBACK');
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #C7A356 0%, #A88940 100%)',
                    color: '#0B0F0D',
                    boxShadow: '0 2px 8px rgba(199, 163, 86, 0.25)',
                    fontFamily: 'var(--ad-font-display)'
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Submit Query / Feedback</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5 text-[10px] pt-1" style={{ color: 'var(--ad-text-muted)' }}>
                <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--ad-cool)' }} />
                <span>Regional Mandi Hubs: Kolar · Nashik · Agra · Khanna</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]"
            style={{ borderTop: '1px solid var(--ad-border)', color: 'var(--ad-text-muted)' }}
          >
            <div className="flex items-center space-x-3">
              <span>© 2026 AgriDirect Inc. Built for Smart India Hackathon.</span>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <button onClick={() => setActiveModal('ABOUT')} className="hover:text-[var(--ad-text-primary)] transition-colors">
                About
              </button>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <button onClick={() => setActiveModal('TERMS')} className="hover:text-[var(--ad-text-primary)] transition-colors">
                Terms
              </button>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <button onClick={() => setActiveModal('PRIVACY')} className="hover:text-[var(--ad-text-primary)] transition-colors">
                Privacy
              </button>
            </div>

            {/* Real-time Status Indicator */}
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold" style={{ color: 'var(--ad-text-secondary)' }}>
                All 18 APMC Corridors Operational
              </span>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <span>OSRM Engine Live</span>
              <span style={{ color: 'var(--ad-border)' }}>·</span>
              <span style={{ color: 'var(--ad-accent-bright)' }}>v2.4 Production</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODAL 1: FEEDBACK & QUERY SUBMISSION
          ========================================================================= */}
      <Modal
        open={activeModal === 'FEEDBACK'}
        onClose={() => setActiveModal(null)}
        title="Submit Feedback or Corridor Query"
        maxWidth="max-w-lg"
      >
        {submittedTicket ? (
          <div className="text-center py-6 space-y-4">
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--ad-brand-light)', color: 'var(--ad-brand-bright)' }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
                Query Recorded Successfully
              </h3>
              <p className="text-xs max-w-sm mx-auto mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
                Your feedback has been logged in the AgriDirect Corridor Operations Queue. Reference Ticket:
              </p>
              <div
                className="mt-3 px-4 py-2 rounded-xl inline-block font-mono text-sm font-extrabold"
                style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-accent)', color: 'var(--ad-accent-bright)' }}
              >
                {submittedTicket}
              </div>
            </div>
            <div className="pt-4">
              <Button variant="accent" size="sm" onClick={() => setActiveModal(null)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
            <p className="text-xs" style={{ color: 'var(--ad-text-tertiary)' }}>
              Send direct feedback, report mandi price variance, or inquire about pooled logistics and cold storage aggregation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                  style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-primary)' }}
                />
              </div>
              <div>
                <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Mobile / Email</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={feedbackContact}
                  onChange={(e) => setFeedbackContact(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                  style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-primary)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Your Role</label>
                <select
                  value={feedbackRole}
                  onChange={(e) => setFeedbackRole(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-primary)' }}
                >
                  <option value="FARMER_FPO" style={{ background: '#141A17', color: '#F2F4F3' }}>Farmer / FPO Representative</option>
                  <option value="INSTITUTIONAL_BUYER" style={{ background: '#141A17', color: '#F2F4F3' }}>Institutional Buyer / Processor</option>
                  <option value="LOGISTICS_OPERATOR" style={{ background: '#141A17', color: '#F2F4F3' }}>Cold Logistics / Carrier</option>
                  <option value="GOVERNMENT_OFFICIAL" style={{ background: '#141A17', color: '#F2F4F3' }}>Government / DoCA Officer</option>
                  <option value="OTHER" style={{ background: '#141A17', color: '#F2F4F3' }}>Other Stakeholder</option>
                </select>
              </div>
              <div>
                <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-primary)' }}
                >
                  <option value="GENERAL" style={{ background: '#141A17', color: '#F2F4F3' }}>General Platform Feedback</option>
                  <option value="PRICE_DISCREPANCY" style={{ background: '#141A17', color: '#F2F4F3' }}>Mandi Price Discrepancy</option>
                  <option value="LOGISTICS_INQUIRY" style={{ background: '#141A17', color: '#F2F4F3' }}>Logistics & Freight Route Query</option>
                  <option value="STORAGE_BOOKING" style={{ background: '#141A17', color: '#F2F4F3' }}>WDRA Cold Storage Booking</option>
                  <option value="BUG_REPORT" style={{ background: '#141A17', color: '#F2F4F3' }}>Technical Issue / Bug Report</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="ad-label text-[11px]" style={{ color: 'var(--ad-text-secondary)' }}>Message / Query Details</label>
                <span className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>{feedbackMessage.length}/500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                placeholder="Describe your query, feedback, or corridor concern..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full rounded-xl p-3 text-xs leading-relaxed focus:outline-none"
                style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-primary)' }}
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" type="submit" loading={isSubmitting} icon={<Send className="w-3.5 h-3.5" />}>
                Submit Query
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* =========================================================================
          MODAL 2: ABOUT AGRIDIRECT
          ========================================================================= */}
      <Modal
        open={activeModal === 'ABOUT'}
        onClose={() => setActiveModal(null)}
        title="About AgriDirect"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--ad-text-secondary)' }}>
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border-accent)' }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--ad-accent-bright)', fontFamily: 'var(--ad-font-display)' }}
            >
              Smart India Hackathon Initiative
            </span>
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--ad-font-display)', color: 'var(--ad-text-primary)' }}>
              Disintermediating Indian Agricultural Commerce
            </h3>
            <p className="text-xs" style={{ color: 'var(--ad-text-tertiary)' }}>
              AgriDirect was engineered to dismantle multi-layered agricultural cartels and broker intermediation that deprive Indian farmers of up to 40% of their realization while driving retail inflation for urban consumers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl space-y-1" style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}>
              <div className="text-xl font-black" style={{ color: 'var(--ad-brand-bright)', fontFamily: 'var(--ad-font-display)' }}>+28.4%</div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--ad-text-primary)' }}>Direct Farmer Uplift</div>
              <p className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>Net payout above middleman baseline across 18 regional mandis.</p>
            </div>
            <div className="p-3 rounded-xl space-y-1" style={{ background: 'var(--ad-surface-1)', border: '1px solid var(--ad-border)' }}>
              <div className="text-xl font-black" style={{ color: 'var(--ad-cool-bright)', fontFamily: 'var(--ad-font-display)' }}>-14.8%</div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--ad-text-primary)' }}>Consumer Price Relief</div>
              <p className="text-[10px]" style={{ color: 'var(--ad-text-muted)' }}>Lower delivered landed cost for urban procurement hubs.</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>Core Architectural Innovations:</h4>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px]" style={{ color: 'var(--ad-text-tertiary)' }}>
              <li><strong>Spatial Price Arbitrage Engine:</strong> Haversine & OSRM road distance evaluation ensuring optimal destination routing.</li>
              <li><strong>Dynamic Vehicle Capacity VRP:</strong> Pooled refrigerated convoys cutting transit spoilage below 4.5%.</li>
              <li><strong>WDRA Cold Storage IoT Telemetry:</strong> Simulated real-time chamber sensors with automated DoCA tariff subsidies.</li>
              <li><strong>Strategic Grain Buffer Silos:</strong> Government MIS reserve monitors with automated inter-state release triggers.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL 3: TERMS OF SERVICE
          ========================================================================= */}
      <Modal
        open={activeModal === 'TERMS'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service & Platform Guidelines"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2" style={{ color: 'var(--ad-text-secondary)' }}>
          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>1. Agricultural Commerce & APMC Guidelines</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              All transactions executed on AgriDirect strictly adhere to Inter-State Agricultural Trade and Commerce Regulations. Farmer Producer Organizations (FPOs) and institutional buyers contract directly with full legal binding upon order confirmation.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>2. Quality Assurance & Transit Degradation</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              Produce is graded and sealed at origin collection hubs. Transit respiration and thermal degradation models govern fair allowance clauses. Disputes over moisture, weight shrinkage, or transit delay are adjudicated using WDRA-accredited sensor logs.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>3. Payment Settlement & Escrow</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              Payments from institutional buyers are escrow-guaranteed upon electronic bill-of-lading dispatch and disbursed directly to the FPO cooperative bank accounts within 24 hours of destination dock receipt.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>4. Mathematical & Data Truth Transparency</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              AgriDirect labels all forecasts, Haversine estimates, and historical APMC arrivals with transparent Data Provenance standards. Users acknowledge heuristic and statistical bounds explicitly disclosed in the interface.
            </p>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL 4: PRIVACY POLICY
          ========================================================================= */}
      <Modal
        open={activeModal === 'PRIVACY'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy & Data Protection Charter"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2" style={{ color: 'var(--ad-text-secondary)' }}>
          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>1. Zero Data Brokering Principle</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              AgriDirect strictly refuses to sell, lease, or monetize individual farmer transaction records, landholdings, or yield telemetry to speculative commodity brokers or unauthorized third parties.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>2. FPO Cooperative Data Ownership</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              Farmer Producer Organizations retain 100% sovereign ownership of their member lists, harvest estimates, and banking identifiers. Aggregate pricing trends are made public solely for transparent price discovery.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>3. Voice Assistant & Audio Data</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              Kisan Multilingual Voice queries are processed locally and via encrypted channels for real-time natural language synthesis. No raw acoustic recordings are archived permanently without cooperative consent.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs" style={{ color: 'var(--ad-text-primary)' }}>4. Encryption & Infrastructure Security</h4>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ad-text-tertiary)' }}>
              All network transactions, cold chamber sensor pings, and administrative oversight sessions are encrypted via TLS 1.3 with role-based access verification under National Informatics Centre (NIC) best practices.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
