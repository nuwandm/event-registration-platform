import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Search, Ticket, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

/* ── Floating CTA pill ───────────────────────────────────────────────────── */
function FloatingTracker({ onClick }: { onClick: () => void }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Slide in after 800ms
    const show = setTimeout(() => setVisible(true), 800);
    // Auto-hide after 8s
    const hide = setTimeout(() => setDismissed(true), 8000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
    >
      <div className="relative">
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />

        <button
          onClick={() => { onClick(); setDismissed(true); }}
          className="relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl shadow-blue-500/40 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-blue-200 leading-none mb-0.5">Already registered?</p>
            <p className="text-sm font-semibold leading-none">Track your Registration</p>
          </div>
          <ChevronDown className="w-4 h-4 text-blue-200 ml-1 group-hover:translate-y-0.5 transition-transform" />
        </button>

        {/* Dismiss × */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center hover:bg-slate-900 transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ── Main widget ─────────────────────────────────────────────────────────── */
export function StatusCheckWidget() {
  const [refNumber, setRefNumber] = useState('');
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToWidget = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      sectionRef.current?.querySelector('input')?.focus();
    }, 400);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = refNumber.trim().toUpperCase();
    if (!trimmed) return;
    navigate(`/registration/status/${trimmed}`);
  };

  return (
    <>
      <FloatingTracker onClick={scrollToWidget} />

      {/* Section wrapper */}
      <div ref={sectionRef} className="relative">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-indigo-50 to-slate-50 rounded-3xl -z-10" />
        <div className="absolute inset-0 rounded-3xl border border-blue-100/80 -z-10" />

        <div className="absolute top-5 right-5 opacity-5 pointer-events-none">
          <Ticket className="w-24 h-24 text-blue-900" />
        </div>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-0.5">Track your Registration</h2>
              <p className="text-sm text-slate-500">
                Enter your unique reference number to check your approval status and download your QR code.
              </p>
            </div>
          </div>

          {/* Input row */}
          <form onSubmit={handleCheck} className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. EVT-2026-000001-A3K9XZ"
                className="w-full pl-9 pr-4 py-3 text-sm border border-slate-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase placeholder:normal-case placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!refNumber.trim()}
              className="rounded-xl px-5 shadow-md shadow-blue-500/20"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Check Status
              </span>
            </Button>
          </form>

          <p className="text-xs text-slate-400">
            Your reference number was shown on screen after you submitted your registration.
          </p>
        </div>
      </div>
    </>
  );
}
