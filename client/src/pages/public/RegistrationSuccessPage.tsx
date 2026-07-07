import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, CalendarDays, Hash, ArrowRight } from 'lucide-react';

import { registrationsApi } from '@/api/registrationsApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function RegistrationSuccessPage() {
  const [params] = useSearchParams();
  const id = params.get('id');

  const { data: registration, isLoading } = useQuery({
    queryKey: ['registration-status', id],
    queryFn: () => registrationsApi.getStatus(id!),
    select: (res) => res.data.data?.registration,
    enabled: !!id,
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your registration has been submitted successfully.
          You will receive your QR code once your payment receipt is verified by our team.
        </p>

        {/* Registration details card */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-3 text-left">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : registration ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 text-left space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Registration Number</p>
                <p className="font-bold text-slate-800 text-lg tracking-wide">
                  {registration.registrationNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow icon={CalendarDays} label="Name" value={registration.fullName} />
              <InfoRow icon={CalendarDays} label="Email" value={registration.email} />
              {typeof registration.eventId === 'object' && registration.eventId !== null && 'name' in registration.eventId && (
                <InfoRow icon={CalendarDays} label="Event" value={(registration.eventId as { name: string }).name} />
              )}
            </div>

            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-3 mt-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">
                Status: <strong className="capitalize">{registration.status}</strong> — pending review
              </p>
            </div>
          </div>
        ) : null}

        {/* What happens next */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-8 text-left">
          <p className="text-sm font-semibold text-blue-800 mb-3">What happens next?</p>
          <ol className="space-y-2 text-sm text-blue-700">
            {[
              'Our team reviews your payment receipt',
              'Your registration gets approved',
              'A unique QR code is generated for you',
              'Present your QR code at the event entrance',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
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
            <Link to="/">Browse More Events</Link>
          </Button>
          {id && (
            <Button asChild>
              <Link to={`/registration/${id}/qr`}>
                Check QR Status
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  );
}
