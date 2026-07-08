import { useTenant } from '@/context/TenantContext';
import { StatusCheckWidget } from '@/components/public/StatusCheckWidget';

export function HomePage() {
  const { tenant } = useTenant();
  const brand = tenant?.primaryColor ?? '#3b82f6';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      {tenant?.logoUrl && (
        <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-auto object-contain mb-6" />
      )}
      {tenant?.name && (
        <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: brand }}>
          {tenant.name}
        </p>
      )}
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Event Registration</h1>
      <p className="text-slate-500 text-sm mb-10 text-center max-w-sm">
        To register for an event, use the link provided by the organiser. If you already have a
        registration, enter your reference number below to check your status.
      </p>
      <div className="w-full max-w-md">
        <StatusCheckWidget />
      </div>
    </div>
  );
}
