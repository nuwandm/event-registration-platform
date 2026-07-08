import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Hash, Search, CheckCircle2, XCircle, Clock, Ticket, ChevronDown } from 'lucide-react';

import { registrationsApi } from '@/api/registrationsApi';
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
  const [submitted, setSubmitted] = useState('');
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToWidget = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus the input after scroll
    setTimeout(() => {
      sectionRef.current?.querySelector('input')?.focus();
    }, 400);
  };

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ['check-registration', submitted],
    queryFn: () => registrationsApi.checkByNumber(submitted),
    select: (res) => res.data.data?.registration,
    enabled: !!submitted,
    retry: false,
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = refNumber.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitted(trimmed);
  };

  const statusBadge = (status: string) => {
    if (status === 'approved')
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'rejected')
      return 'text-red-700 bg-red-50 border-red-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  return (
    <>
      <FloatingTracker onClick={scrollToWidget} />

      {/* Section wrapper */}
      <div ref={sectionRef} className="relative">
        {/* Decorative gradient backdrop */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-indigo-50 to-slate-50 rounded-3xl -z-10" />
        <div className="absolute inset-0 rounded-3xl border border-blue-100/80 -z-10" />

        {/* Corner QR decoration */}
        <div className="absolute top-5 right-5 opacity-5 pointer-events-none">
          <QrCode className="w-24 h-24 text-blue-900" />
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
                placeholder="Enter reference number  e.g. EVT-001"
                className="w-full pl-9 pr-4 py-3 text-sm border border-slate-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase placeholder:normal-case placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !refNumber.trim()}
              className="rounded-xl px-5 shadow-md shadow-blue-500/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Checking…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Check Status
                </span>
              )}
            </Button>
          </form>

          <p className="text-xs text-slate-400 mb-5">
            Your reference number was shown on screen after you submitted your registration.
          </p>

          {/* Error */}
          {isError && submitted && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 shrink-0" />
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'No registration found with this reference number.'}
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              {/* Status bar */}
              <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${statusBadge(result.status)}`}>
                <StatusIcon status={result.status} />
                <span className="font-semibold capitalize">{result.status}</span>
                <span className="ml-auto text-xs font-mono font-bold tracking-wider opacity-70">
                  {result.registrationNumber}
                </span>
              </div>

              {/* Details */}
              <div className="px-5 py-4 space-y-2 text-sm">
                <ResultRow label="Name" value={result.fullName} />
                <ResultRow label="Email" value={result.email} />
                {typeof result.eventId === 'object' &&
                  result.eventId !== null &&
                  'name' in result.eventId && (
                    <ResultRow
                      label="Event"
                      value={(result.eventId as { name: string }).name}
                    />
                  )}
              </div>

              {/* Action footer */}
              {result.status === 'approved' && result.qrCodeUrl && (
                <div className="px-5 py-4 bg-emerald-50 border-t border-emerald-100">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow shadow-emerald-500/20"
                    onClick={() => navigate(`/registration/${String(result._id)}/qr`)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    View My QR Code
                  </Button>
                </div>
              )}
              {result.status === 'pending' && (
                <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Your payment receipt is being reviewed. Check back soon.
                </div>
              )}
              {result.status === 'rejected' && (
                <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center gap-2 text-xs text-red-700">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {result.adminRemarks ?? 'Your registration was not approved.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right truncate">{value}</span>
    </div>
  );
}
