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

      <h1 className="text-3xl font-bold text-slate-800 mb-3">{event.name}</h1>
      <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-line">{event.description}</p>

      <Separator className="mb-6" />

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        <InfoBlock icon={CalendarDays} label="Event Date">
          {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}<br />
          <span className="text-slate-400 text-xs">{format(new Date(event.eventDate), 'h:mm a')}</span>
        </InfoBlock>
        <InfoBlock icon={MapPin} label="Venue">{event.venue}</InfoBlock>
        <InfoBlock icon={CreditCard} label="Registration Fee">
          {event.registrationFee === 0 ? 'Free' : `LKR ${event.registrationFee.toLocaleString()}`}
        </InfoBlock>
        {event.maxParticipants && (
          <InfoBlock icon={Users} label="Capacity">
            {event.registrationCount} / {event.maxParticipants} registered
          </InfoBlock>
        )}
        <InfoBlock icon={CalendarDays} label="Registration Window">
          {format(new Date(event.registrationOpenDate), 'MMM d')} –{' '}
          {format(new Date(event.registrationCloseDate), 'MMM d, yyyy')}
        </InfoBlock>
      </div>

      {/* Bank Details */}
      {event.registrationFee > 0 && (
        <div className="bg-blue-50 rounded-xl p-5 mb-7 border border-blue-100">
          <div className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
            <Building2 className="w-4 h-4" />
            Bank Transfer Details
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Bank</span>
            <span className="text-slate-800 font-medium">{event.bankDetails.bankName}</span>
            <span className="text-slate-500">Account Name</span>
            <span className="text-slate-800 font-medium">{event.bankDetails.accountName}</span>
            <span className="text-slate-500">Account Number</span>
            <span className="text-slate-800 font-medium">{event.bankDetails.accountNumber}</span>
            <span className="text-slate-500">Branch</span>
            <span className="text-slate-800 font-medium">{event.bankDetails.branch}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      {isRegistrationOpen && (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to={`/events/${event.slug}/register`}>
            Register for this Event
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
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
    <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <Icon className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{children}</p>
      </div>
    </div>
  );
}
