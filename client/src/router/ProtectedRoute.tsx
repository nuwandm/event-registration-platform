import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'super_admin' | 'org_admin_or_staff';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, admin } = useAuthStore();
  const { pathname } = useLocation();
  const { orgSlug } = useParams<{ orgSlug: string }>();

  if (!isAuthenticated || !admin) {
    if (requiredRole === 'super_admin') {
      return <Navigate to="/superadmin/login" replace />;
    }
    return <Navigate to={`/${orgSlug}/admin/login`} replace />;
  }

  if (requiredRole === 'super_admin' && admin.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'org_admin_or_staff') {
    if (admin.role === 'super_admin') {
      return <Navigate to="/superadmin" replace />;
    }
    // Staff can only access attendance scanner
    if (admin.role === 'staff' && !pathname.endsWith('/admin/attendance')) {
      return <Navigate to={`/${orgSlug}/admin/attendance`} replace />;
    }
    // Only org_admin can access user management
    if (pathname.includes('/admin/users') && admin.role !== 'org_admin') {
      return <Navigate to={`/${orgSlug}/admin`} replace />;
    }
  }

  return <Outlet />;
}
