import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated, admin } = useAuthStore();
  const { pathname } = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Staff can only access the attendance scanner
  if (admin?.role === 'staff' && pathname !== '/admin/attendance') {
    return <Navigate to="/admin/attendance" replace />;
  }

  // Only super_admin can access user management
  if (pathname.startsWith('/admin/users') && admin?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
