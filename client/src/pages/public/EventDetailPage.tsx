import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, CreditCard, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

import { eventsApi } from '@/api/eventsApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusCheckWidget } from '@/components/public/StatusCheckWidget';

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => eventsApi.getBySlug(slug!),
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
        <Button asChild variant="outline"><Link to="/">Back to events</Link></Button>
      </div>
    );
  }

  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
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
        <InfoBlock icon={CalendarDays} label="Event Date">
          {format(new Date(event.eventDate), 'EEE, MMM d, yyyy')}
          <span className="text-slate-400"> · {format(new Date(event.eventDate), 'h:mm a')}</span>
        </InfoBlock>
        <InfoBlock icon={MapPin} label="Venue">{event.venue}</InfoBlock>
        <InfoBlock icon={CreditCard} label="Registration Fee">
          {event.registrationFee === 0 ? 'Free' : `LKR ${event.registrationFee.toLocaleString()}`}
        </InfoBlock>
        <InfoBlock icon={CalendarDays} label="Registration Window">
          {format(new Date(event.registrationOpenDate), 'MMM d')} – {format(new Date(event.registrationCloseDate), 'MMM d, yyyy')}
        </InfoBlock>
        {event.maxParticipants && (
          <InfoBlock icon={Users} label="Capacity">
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
          <Link to={`/events/${event.slug}/register`}>
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

function InfoBlock({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <Icon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-xs text-slate-700 font-semibold leading-snug">{children}</p>
      </div>
    </div>
  );
}
