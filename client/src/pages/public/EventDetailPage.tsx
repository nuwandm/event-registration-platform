import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, CreditCard, Building2, ArrowRight } from 'lucide-react';
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
      </div>
    );
  }

  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

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

      {/* Floating WhatsApp button */}
      {event.whatsappNumber && (
        <a
          href={`https://wa.me/${event.whatsappNumber}?text=${encodeURIComponent(`Hi! I'd like to get more information about *${event.name}* (${format(new Date(event.eventDate), 'MMM d, yyyy · h:mm a')}). Could you please help me?`)}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
          aria-label="Need help? Chat on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.528 5.852L.057 23.457a.5.5 0 0 0 .61.61l5.606-1.471A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.802 9.802 0 0 1-5.032-1.388l-.36-.214-3.733.979.997-3.648-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
          </svg>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] font-normal opacity-80">Need help?</span>
            <span>Chat on WhatsApp</span>
          </span>
        </a>
      )}
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
