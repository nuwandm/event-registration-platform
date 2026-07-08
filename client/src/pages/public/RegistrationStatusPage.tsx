import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, XCircle, CalendarDays, MapPin, Hash,
  Download, ArrowLeft, User, Mail, Phone, Building2, CreditCard, QrCode,
} from 'lucide-react';
import { format } from 'date-fns';

import { registrationsApi } from '@/api/registrationsApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    headerBg: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-100 text-amber-800 border border-amber-200',
    label: 'Pending Approval',
    desc: 'Your registration is under review. Your QR code will appear here once approved.',
  },
  approved: {
    icon: CheckCircle2,
    headerBg: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    label: 'Approved',
    desc: 'Your registration is approved. Present this QR code at the event entrance.',
  },
  rejected: {
    icon: XCircle,
    headerBg: 'from-red-500 to-rose-600',
    badgeBg: 'bg-red-100 text-red-800 border border-red-200',
    label: 'Rejected',
    desc: 'Your registration was not approved. Please contact the organiser.',
  },
};

export function RegistrationStatusPage() {
  const { refNumber } = useParams<{ refNumber: string }>();
  const navigate = useNavigate();

  const { data: registration, isLoading, isError } = useQuery({
    queryKey: ['registration-status-by-ref', refNumber],
    queryFn: () => registrationsApi.checkByNumber(refNumber!),
    select: (res) => res.data.data?.registration,
    enabled: !!refNumber,
    retry: false,
    refetchInterval: (q) =>
      (q.state.data as { status?: string } | undefined)?.status === 'pending' ? 30_000 : false,
  });

  const handleDownload = () => {
    if (!registration?.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = registration.qrCodeUrl;
    a.download = `${registration.registrationNumber}-qr.png`;
    a.click();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (isError || !registration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            No registration found for reference number <strong className="font-mono">{refNumber}</strong>.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[registration.status];
  const StatusIcon = cfg.icon;
  const event = typeof registration.eventId === 'object' && registration.eventId !== null
    ? registration.eventId as Event
    : null;

  // ── Page ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* ── Status header card ─────────────────────────────────────────────── */}
        <div className={`rounded-2xl bg-linear-to-br ${cfg.headerBg} p-6 mb-4 text-white shadow-lg`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <StatusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-0.5">Registration Status</p>
                <h1 className="text-xl font-bold leading-tight">{cfg.label}</h1>
              </div>
            </div>
            <span className="font-mono text-xs bg-white/20 px-3 py-1.5 rounded-full shrink-0">
              {registration.registrationNumber}
            </span>
          </div>

          <p className="text-white/80 text-sm mt-4 leading-relaxed">{cfg.desc}</p>

          {/* Event info strip */}
          {event && (
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <CalendarDays className="w-4 h-4 text-white/60 shrink-0" />
                <span className="font-semibold truncate">{event.name}</span>
              </div>
              {event.eventDate && (
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4 text-white/60 shrink-0" />
                  {format(new Date(event.eventDate), 'MMM d, yyyy · h:mm a')}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2 text-white/80 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-white/60 shrink-0" />
                  {event.venue}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* ── Participant details ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Your Details
            </h2>
            <div className="space-y-3">
              <Detail icon={User} label="Name" value={registration.fullName} />
              <Detail icon={Mail} label="Email" value={registration.email} />
              <Detail icon={Phone} label="Mobile" value={registration.mobile} />
              <Detail icon={CreditCard} label="NIC / Passport" value={registration.nic} />
              {registration.organization && (
                <Detail icon={Building2} label="Organization" value={registration.organization} />
              )}
              {registration.designation && (
                <Detail icon={Building2} label="Designation" value={registration.designation} />
              )}
              <Detail icon={Hash} label="Ref. No." value={registration.registrationNumber} />
              <Detail icon={CalendarDays} label="Registered" value={format(new Date(registration.createdAt), 'MMM d, yyyy')} />
            </div>

            {/* Attendance badge */}
            {registration.attendanceStatus === 'attended' && registration.attendanceTime && (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2.5 mt-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 text-xs font-medium">
                  Checked in · {format(new Date(registration.attendanceTime), 'h:mm a, MMM d')}
                </span>
              </div>
            )}

            {/* Rejection reason */}
            {registration.status === 'rejected' && registration.adminRemarks && (
              <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700 mt-4">
                <p className="font-semibold mb-1">Reason:</p>
                <p>{registration.adminRemarks}</p>
              </div>
            )}
          </div>

          {/* ── QR code panel ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 self-start">
              <QrCode className="w-4 h-4 text-slate-400" /> Event QR Code
            </h2>

            {registration.status === 'approved' && registration.qrCodeUrl ? (
              <>
                <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner mb-3">
                  <img
                    src={registration.qrCodeUrl}
                    alt="QR Code"
                    className="w-44 h-44 sm:w-52 sm:h-52"
                  />
                </div>
                <p className="text-xs text-slate-400 text-center mb-4">
                  Show this at the event entrance
                </p>
                <Button onClick={handleDownload} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR (PNG)
                </Button>
              </>
            ) : registration.status === 'pending' ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <div className="w-44 h-44 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                  <Clock className="w-10 h-10 text-slate-300" />
                  <p className="text-xs text-slate-400 text-center px-4">QR code will appear after approval</p>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  This page refreshes automatically every 30 seconds
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <div className="w-44 h-44 rounded-2xl bg-red-50 border-2 border-dashed border-red-200 flex flex-col items-center justify-center gap-2">
                  <XCircle className="w-10 h-10 text-red-300" />
                  <p className="text-xs text-red-400 text-center px-4">QR code not available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Bookmark this page or save your reference number{' '}
          <span className="font-mono font-semibold">{registration.registrationNumber}</span>{' '}
          to check back anytime.
        </p>

        <div className="flex justify-center mt-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <CalendarDays className="w-4 h-4 mr-1.5" /> Browse More Events
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
      <span className="text-slate-400 shrink-0 w-24">{label}</span>
      <span className="font-medium text-slate-700 break-words min-w-0">{value}</span>
    </div>
  );
}
