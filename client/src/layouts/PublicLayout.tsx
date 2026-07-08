import { useState } from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';
import { useTenant } from '@/context/TenantContext';

export function PublicLayout() {
  const [showContact, setShowContact] = useState(false);
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { tenant } = useTenant();

  const brand = tenant?.primaryColor ?? '#3b82f6';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to={`/${orgSlug}`} className="flex items-center gap-3">
            {tenant?.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-12 w-auto object-contain"
              />
            )}
            <div className="flex flex-col justify-center">
              {tenant?.name ? (
                <>
                  <p className="font-bold text-slate-800 text-base leading-tight">{tenant.name}</p>
                  <p className="text-xs text-slate-400 leading-none">Event Registration Portal</p>
                </>
              ) : (
                <img src="/Event Hub.png" alt="EventHub" className="h-10 w-auto object-contain" />
              )}
            </div>
          </Link>
        </div>

        {/* Brand color accent line */}
        <div className="h-0.5 w-full" style={{ background: brand }} />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          {tenant?.name && (
            <span className="font-medium text-slate-500">&copy; {new Date().getFullYear()} {tenant.name}</span>
          )}
          <span>
            Powered by{' '}
            <button
              onClick={() => setShowContact((v) => !v)}
              className="font-semibold text-blue-600 hover:underline focus:outline-none"
            >
              EventHub
            </button>
            {showContact && (
              <a
                href="https://wa.me/94706151051"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 ml-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.571a.75.75 0 0 0 .921.921l5.726-1.475A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.943 0-3.76-.524-5.318-1.438l-.38-.224-3.94 1.015 1.034-3.792-.247-.393A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                +94 70 615 1051
              </a>
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
