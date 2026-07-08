import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { useTenant } from '@/context/TenantContext';
import type { Event } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusCheckWidget } from '@/components/public/StatusCheckWidget';

function EventCard({ event, orgSlug, brand }: { event: Event; orgSlug: string; brand: string }) {
  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${brand}cc, ${brand}66)` }}>
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            style={event.bannerPosition ? { objectPosition: `${event.bannerPosition.x}% ${event.bannerPosition.y}%` } : undefined}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          {event.registrationFee === 0 ? (
            <Badge variant="success">Free</Badge>
          ) : (
            <Badge className="bg-white/90 text-slate-800 border-0 shadow-sm">
              LKR {event.registrationFee.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-800 text-base leading-snug mb-2 line-clamp-2">
          {event.name}
        </h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="w-4 h-4 shrink-0" style={{ color: brand }} />
            {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy · h:mm a')}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: brand }} />
            {event.venue}
          </div>
          {event.maxParticipants && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4 shrink-0" style={{ color: brand }} />
              {event.registrationCount} / {event.maxParticipants} registered
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            {isRegistrationOpen ? (
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: brand }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: brand }} />
                Registration Open
              </div>
            ) : new Date() < new Date(event.registrationOpenDate) ? (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="w-3 h-3" />
                Opens {format(new Date(event.registrationOpenDate), 'MMM d')}
              </div>
            ) : (
              <span className="text-xs text-slate-400">Registration Closed</span>
            )}
          </div>
          {isRegistrationOpen && (
            <Link
              to={`/${orgSlug}/events/${event.slug}/register`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: brand }}
            >
              Register <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function HomePage() {
  const { api, orgSlug, tenant } = useTenant();
  const brand = tenant?.primaryColor ?? '#3b82f6';

  const { data, isLoading } = useQuery({
    queryKey: ['public-events', orgSlug],
    queryFn: () => api.events.getPublished(),
    select: (res) => res.data.data?.events ?? [],
  });

  return (
    <div>
      {/* Branded hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${brand}18 0%, ${brand}08 100%)` }}>
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 20% 50%, ${brand} 0%, transparent 60%)` }}
        />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center relative">
          {/* Org logo */}
          {tenant?.logoUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-20 w-auto object-contain drop-shadow-md"
              />
            </div>
          )}

          {tenant?.name && (
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: brand }}>
              {tenant.name}
            </p>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4 leading-tight">
            Upcoming Events
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Browse events, register online, and receive your QR code for seamless entry.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Status check widget */}
        <div className="mb-10">
          <StatusCheckWidget />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Check back later for new events."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((event) => (
              <EventCard key={event._id} event={event} orgSlug={orgSlug} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
