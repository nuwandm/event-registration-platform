import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, CalendarDays, Copy, Check, BookmarkCheck } from 'lucide-react';

import { useTenant } from '@/context/TenantContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function RegistrationSuccessPage() {
  const { api, orgSlug } = useTenant();
  const [params] = useSearchParams();
  const id = params.get('id');
  const [copied, setCopied] = useState(false);

  const { data: registration, isLoading } = useQuery({
    queryKey: ['registration-status', id],
    queryFn: () => api.registrations.getStatus(id!),
    select: (res) => res.data.data?.registration,
    enabled: !!id,
  });

  const handleCopy = () => {
    if (!registration?.registrationNumber) return;
    navigator.clipboard.writeText(registration.registrationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your registration has been received. Save your reference number below —
          you can use it anytime to check your approval status and QR code.
        </p>

        {/* Reference number — most prominent element */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 mb-5">
            <Skeleton className="h-4 w-40 mx-auto mb-3" />
            <Skeleton className="h-10 w-56 mx-auto" />
          </div>
        ) : registration ? (
          <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6 mb-5">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
              Your Unique Reference Number
            </p>
            <p className="text-3xl font-bold text-blue-700 tracking-widest font-mono mb-4">
              {registration.registrationNumber}
            </p>

            {/* Big copy CTA */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied
                ? <><Check className="w-4 h-4" /> Copied to clipboard!</>
                : <><Copy className="w-4 h-4" /> Copy Reference Number</>
              }
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 mt-3">
              <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
              Save this number — you'll need it to track your status
            </div>
          </div>
        ) : null}

        {/* Registration details */}
        {!isLoading && registration && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5 text-left space-y-2.5">
            <InfoRow label="Name" value={registration.fullName} />
            <InfoRow label="Email" value={registration.email} />
            {typeof registration.eventId === 'object' && registration.eventId !== null && 'name' in registration.eventId && (
              <InfoRow label="Event" value={(registration.eventId as { name: string }).name} />
            )}
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2.5 mt-1">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">
                Status: <strong className="capitalize">{registration.status}</strong> — awaiting review
              </p>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-8 text-left">
          <p className="text-sm font-semibold text-slate-700 mb-3">What happens next?</p>
          <ol className="space-y-2 text-sm text-slate-600">
            {[
              'Our team reviews your payment receipt',
              'Your registration gets approved',
              'A unique QR code is generated for you',
              'Visit the home page and enter your reference number to download your QR',
              'Present your QR code at the event entrance',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to={`/${orgSlug}`}>
              <CalendarDays className="w-4 h-4 mr-1.5" />
              Browse More Events
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  );
}
