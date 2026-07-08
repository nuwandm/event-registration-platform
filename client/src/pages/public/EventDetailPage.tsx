import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, CreditCard, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

import { useTenant } from '@/context/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusCheckWidget } from '@/components/public/StatusCheckWidget';

export function EventDetailPage() {
  const { api, orgSlug } = useTenant();
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['public-event', orgSlug, slug],
    queryFn: () => api.events.getBySlug(slug!),
    select: (res) => res.data.data?.event,
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Event not found or no longer available.</p>
        <Button asChild variant="outline"><Link to={`/${orgSlug}`}>Back to events</Link></Button>
      </div>
    );
  }

  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/${orgSlug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-7 bg-linear-to-br from-blue-500 to-indigo-600">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.name}
            className="w-full h-auto block"
            style={event.bannerPosition ? { objectPosition: `${event.bannerPosition.x}% ${event.bannerPosition.y}%` } : undefined}
          />
        ) : (
          <div className="w-full h-56 sm:h-72 flex items-center justify-center">
            <CalendarDays className="w-20 h-20 text-white/20" />
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <Badge variant={isRegistrationOpen ? 'success' : 'secondary'} className="text-sm px-3 py-1">
            {isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}
          </Badge>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-1.5">{event.name}</h1>
      <p className="text-slate-500 leading-relaxed mb-4 whitespace-pre-line text-sm">{event.description}</p>

      <Separator className="mb-4" />

      {/* Details grid — compact 2-col */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <InfoBlock icon={CalendarDays} label="Event Date" color="blue">
          {format(new Date(event.eventDate), 'EEE, MMM d, yyyy')}
          <span className="opacity-70"> · {format(new Date(event.eventDate), 'h:mm a')}</span>
        </InfoBlock>
        <InfoBlock icon={MapPin} label="Venue" color="violet">{event.venue}</InfoBlock>
        <InfoBlock icon={CreditCard} label="Registration Fee" color="emerald">
          {event.registrationFee === 0 ? 'Free' : `LKR ${event.registrationFee.toLocaleString()}`}
        </InfoBlock>
        <InfoBlock icon={CalendarDays} label="Registration Window" color="amber">
          {format(new Date(event.registrationOpenDate), 'MMM d')} – {format(new Date(event.registrationCloseDate), 'MMM d, yyyy')}
        </InfoBlock>
        {event.maxParticipants && (
          <InfoBlock icon={Users} label="Capacity" color="rose">
            {event.registrationCount} / {event.maxParticipants} registered
          </InfoBlock>
        )}
      </div>

      {/* Bank Details — compact inline rows */}
      {event.registrationFee > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-2 text-blue-700 text-xs font-semibold uppercase tracking-wide">
            <Building2 className="w-3.5 h-3.5" />
            Bank Transfer Details
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {[
              ['Bank', event.bankDetails.bankName],
              ['Account Name', event.bankDetails.accountName],
              ['Account No.', event.bankDetails.accountNumber],
              ['Branch', event.bankDetails.branch],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="text-slate-700 font-medium text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA — always full width */}
      {isRegistrationOpen ? (
        <Button asChild size="lg" className="w-full">
          <Link to={`/${orgSlug}/events/${event.slug}/register`}>
            Register for this Event
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      ) : (
        <div className="w-full text-center py-3 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
          Registration is closed
        </div>
      )}

      {/* Status check — participants use the same shared link to track their registration */}
      <div className="mt-10">
        <StatusCheckWidget />
      </div>
    </div>
  );
}

const COLOR_MAP = {
  blue:    { card: 'bg-blue-50 border-blue-100',     icon: 'bg-blue-100 text-blue-600',     label: 'text-blue-400',   value: 'text-blue-900' },
  violet:  { card: 'bg-violet-50 border-violet-100', icon: 'bg-violet-100 text-violet-600', label: 'text-violet-400', value: 'text-violet-900' },
  emerald: { card: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', label: 'text-emerald-500', value: 'text-emerald-900' },
  amber:   { card: 'bg-amber-50 border-amber-100',   icon: 'bg-amber-100 text-amber-600',   label: 'text-amber-500',  value: 'text-amber-900' },
  rose:    { card: 'bg-rose-50 border-rose-100',     icon: 'bg-rose-100 text-rose-600',     label: 'text-rose-400',   value: 'text-rose-900' },
};

function InfoBlock({ icon: Icon, label, children, color = 'blue' }: {
  icon: React.ElementType; label: string; children: React.ReactNode; color?: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={`flex gap-2.5 p-3 rounded-xl border ${c.card}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${c.icon}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${c.label}`}>{label}</p>
        <p className={`text-xs font-semibold leading-snug ${c.value}`}>{children}</p>
      </div>
    </div>
  );
}
