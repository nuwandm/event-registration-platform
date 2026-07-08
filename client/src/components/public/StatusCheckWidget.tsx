import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Search, Ticket } from 'lucide-react';

import { useTenant } from '@/context/TenantContext';
import { Button } from '@/components/ui/button';

/* ── Main widget ─────────────────────────────────────────────────────────── */
export function StatusCheckWidget() {
  const { orgSlug } = useTenant();
  const [refNumber, setRefNumber] = useState('');
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = refNumber.trim().toUpperCase();
    if (!trimmed) return;
    navigate(`/${orgSlug}/registration/status/${trimmed}`);
  };

  return (
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
  );
}
