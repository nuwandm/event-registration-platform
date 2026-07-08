import { useParams } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { TenantProvider } from '@/context/TenantContext';

export function OrgSlugWrapper() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  if (!orgSlug) return null;
  return (
    <TenantProvider orgSlug={orgSlug}>
      <Outlet />
    </TenantProvider>
  );
}
