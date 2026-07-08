import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// Public pages (tenant-scoped)
import { HomePage } from '@/pages/public/HomePage';
import { EventDetailPage } from '@/pages/public/EventDetailPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { RegistrationSuccessPage } from '@/pages/public/RegistrationSuccessPage';
import { QRViewPage } from '@/pages/public/QRViewPage';
import { RegistrationStatusPage } from '@/pages/public/RegistrationStatusPage';

// Admin pages (tenant-scoped)
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { EventsPage } from '@/pages/admin/EventsPage';
import { AdminEventDetailPage } from '@/pages/admin/AdminEventDetailPage';
import { RegistrationsPage } from '@/pages/admin/RegistrationsPage';
import { AttendanceScannerPage } from '@/pages/admin/AttendanceScannerPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { BrandingPage } from '@/pages/admin/BrandingPage';

// Super admin pages (no org scope)
import { SuperAdminLoginPage } from '@/pages/superadmin/SuperAdminLoginPage';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { TenantsPage } from '@/pages/superadmin/TenantsPage';
import { SuperAdminDashboardPage } from '@/pages/superadmin/SuperAdminDashboardPage';

// Platform pages (no org scope)
import { SignupPage } from '@/pages/platform/SignupPage';
import { LandingPage } from '@/pages/platform/LandingPage';

// Wrapper that injects TenantProvider from the :orgSlug route param
import { OrgSlugWrapper } from './OrgSlugWrapper';

const router = createBrowserRouter([
  // ── Platform root ────────────────────────────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/signup', element: <SignupPage /> },

  // ── Super admin ───────────────────────────────────────────────────────────────
  { path: '/superadmin/login', element: <SuperAdminLoginPage /> },
  {
    element: <ProtectedRoute requiredRole="super_admin" />,
    children: [
      {
        element: <SuperAdminLayout />,
        children: [
          { path: '/superadmin', element: <SuperAdminDashboardPage /> },
          { path: '/superadmin/tenants', element: <TenantsPage /> },
        ],
      },
    ],
  },

  // ── Tenant-scoped routes ─────────────────────────────────────────────────────
  {
    path: '/:orgSlug',
    element: <OrgSlugWrapper />,
    children: [
      // Public
      {
        element: <PublicLayout />,
        children: [
          { path: '', element: <HomePage /> },
          { path: 'events/:slug', element: <EventDetailPage /> },
          { path: 'events/:slug/register', element: <RegisterPage /> },
          { path: 'registration/success', element: <RegistrationSuccessPage /> },
          { path: 'registration/:id/qr', element: <QRViewPage /> },
          { path: 'registration/status/:refNumber', element: <RegistrationStatusPage /> },
        ],
      },

      // Admin auth
      { path: 'admin/login', element: <LoginPage /> },

      // Admin protected
      {
        element: <ProtectedRoute requiredRole="org_admin_or_staff" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'admin', element: <DashboardPage /> },
              { path: 'admin/events', element: <EventsPage /> },
              { path: 'admin/events/:id', element: <AdminEventDetailPage /> },
              { path: 'admin/registrations', element: <RegistrationsPage /> },
              { path: 'admin/attendance', element: <AttendanceScannerPage /> },
              { path: 'admin/reports', element: <ReportsPage /> },
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'admin/branding', element: <BrandingPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
