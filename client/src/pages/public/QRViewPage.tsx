import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Download, CheckCircle2, Clock, XCircle, CalendarDays, MapPin, Hash } from 'lucide-react';
import { format } from 'date-fns';

import { useTenant } from '@/context/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    label: 'Pending Approval',
    description: 'Your registration is under review. Your QR code will appear here once approved.',
    badgeVariant: 'pending' as const,
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    label: 'Approved',
    description: 'Your registration is approved. Present this QR code at the event entrance.',
    badgeVariant: 'success' as const,
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Rejected',
    description: 'Your registration was not approved. Please contact the organiser for more information.',
    badgeVariant: 'destructive' as const,
  },
};

export function QRViewPage() {
  const { api } = useTenant();
  const { id } = useParams<{ id: string }>();

  const { data: registration, isLoading, isError } = useQuery({
    queryKey: ['registration-qr', id],
    queryFn: () => api.registrations.getStatus(id!),
    select: (res) => res.data.data?.registration,
    enabled: !!id,
    refetchInterval: (query) =>
      (query.state.data as { status?: string } | undefined)?.status === 'pending' ? 30_000 : false,
  });

  const handleDownload = () => {
    if (!registration?.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = registration.qrCodeUrl;
    a.download = `${registration.registrationNumber}-qr.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 w-64 mx-auto rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !registration) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Registration not found.</p>
      </div>
    );
  }

  const config = STATUS_CONFIG[registration.status];
  const StatusIcon = config.icon;
  const event = typeof registration.eventId === 'object' ? registration.eventId as { name: string; venue?: string; eventDate?: string } : null;

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Event Pass</p>
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
          </div>
          <h2 className="text-xl font-bold">{registration.fullName}</h2>
          {event && <p className="text-slate-300 text-sm mt-0.5">{event.name}</p>}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status block */}
          <div className={`flex items-start gap-3 rounded-xl p-4 mb-5 ${config.bg}`}>
            <StatusIcon className={`w-5 h-5 mt-0.5 shrink-0 ${config.color}`} />
            <p className={`text-sm ${config.color} font-medium`}>{config.description}</p>
          </div>

          {/* QR Code */}
          {registration.status === 'approved' && registration.qrCodeUrl ? (
            <div className="text-center mb-5">
              <div className="inline-block p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
                <img
                  src={registration.qrCodeUrl}
                  alt="QR Code"
                  className="w-52 h-52"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">Scan at event entrance</p>
            </div>
          ) : registration.status === 'pending' ? (
            <div className="w-52 h-52 mx-auto mb-5 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
              <Clock className="w-10 h-10 text-slate-300" />
              <p className="text-xs text-slate-400 text-center px-4">QR code will appear after approval</p>
            </div>
          ) : null}

          {/* Details */}
          <div className="space-y-2 text-sm mb-5">
            <Detail icon={Hash} label="Registration No." value={registration.registrationNumber} />
            {event?.venue && <Detail icon={MapPin} label="Venue" value={event.venue} />}
            {event?.eventDate && (
              <Detail icon={CalendarDays} label="Date" value={format(new Date(event.eventDate), 'MMM d, yyyy')} />
            )}
            {registration.attendanceStatus === 'attended' && registration.attendanceTime && (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 mt-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700 text-xs font-medium">
                  Checked in at {format(new Date(registration.attendanceTime), 'h:mm a, MMM d')}
                </span>
              </div>
            )}
          </div>

          {/* Admin remarks on rejection */}
          {registration.status === 'rejected' && registration.adminRemarks && (
            <div className="bg-red-50 rounded-lg px-4 py-3 text-sm text-red-700 mb-5">
              <p className="font-medium mb-0.5">Reason:</p>
              <p>{registration.adminRemarks}</p>
            </div>
          )}

          {/* Download */}
          {registration.status === 'approved' && registration.qrCodeUrl && (
            <Button onClick={handleDownload} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code (PNG)
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Keep this page saved. You'll need your QR code at the event entrance.
      </p>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
