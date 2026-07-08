import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { tenantApi } from '@/api/tenantApi';
import { eventsApi } from '@/api/eventsApi';
import { registrationsApi } from '@/api/registrationsApi';
import { attendanceApi } from '@/api/attendanceApi';
import { dashboardApi } from '@/api/dashboardApi';
import { usersApi } from '@/api/usersApi';
import type { PublicTenantInfo } from '@/types';

interface TenantContextValue {
  orgSlug: string;
  tenant: PublicTenantInfo | null;
  isLoading: boolean;
  api: {
    events: ReturnType<typeof eventsApi>;
    registrations: ReturnType<typeof registrationsApi>;
    attendance: ReturnType<typeof attendanceApi>;
    dashboard: ReturnType<typeof dashboardApi>;
    users: ReturnType<typeof usersApi>;
  };
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const [tenant, setTenant] = useState<PublicTenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tenantApi.getPublicInfo(orgSlug)
      .then((res) => setTenant(res.data.data?.tenant ?? null))
      .catch(() => setTenant(null))
      .finally(() => setIsLoading(false));
  }, [orgSlug]);

  // Apply brand color as CSS custom property
  useEffect(() => {
    if (tenant?.primaryColor) {
      document.documentElement.style.setProperty('--brand-color', tenant.primaryColor);
    }
  }, [tenant?.primaryColor]);

  const value: TenantContextValue = {
    orgSlug,
    tenant,
    isLoading,
    api: {
      events: eventsApi(orgSlug),
      registrations: registrationsApi(orgSlug),
      attendance: attendanceApi(orgSlug),
      dashboard: dashboardApi(orgSlug),
      users: usersApi(orgSlug),
    },
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
