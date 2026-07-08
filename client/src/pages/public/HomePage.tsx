import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { eventsApi } from '@/api/eventsApi';
import type { Event } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusCheckWidget } from '@/components/public/StatusCheckWidget';

function EventCard({ event }: { event: Event }) {
  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Banner */}
      <div className="relative h-44 bg-linear-to-br from-blue-500 to-indigo-600 overflow-hidden">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <Badge className="bg-white/90 text-slate-800 border-0">
              LKR {event.registrationFee.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-800 text-lg leading-snug mb-2 line-clamp-2">
          {event.name}
        </h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="w-4 h-4 shrink-0 text-blue-500" />
            {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy · h:mm a')}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 shrink-0 text-blue-500" />
            {event.venue}
          </div>
          {event.maxParticipants && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4 shrink-0 text-blue-500" />
              {event.registrationCount} / {event.maxParticipants} registered
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            {isRegistrationOpen ? (
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
            <Button asChild size="sm">
              <Link to={`/events/${event.slug}/register`}>
                Register
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
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
  const { data, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => eventsApi.getPublished(),
    select: (res) => res.data.data?.events ?? [],
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
          <CalendarDays className="w-4 h-4" />
          Upcoming Events
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4 leading-tight">
          Register for Events
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Browse upcoming events, register online, and receive your QR code for seamless entry.
        </p>
      </div>

      {/* Status check widget */}
      <div className="mb-12">
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
          {data.map((event) => <EventCard key={event._id} event={event} />)}
        </div>
      )}
    </div>
  );
}
