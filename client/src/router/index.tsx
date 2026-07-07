import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// Public pages
import { HomePage } from '@/pages/public/HomePage';
import { EventDetailPage } from '@/pages/public/EventDetailPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { RegistrationSuccessPage } from '@/pages/public/RegistrationSuccessPage';
import { QRViewPage } from '@/pages/public/QRViewPage';

// Admin pages
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { EventsPage } from '@/pages/admin/EventsPage';
import { RegistrationsPage } from '@/pages/admin/RegistrationsPage';
import { AttendanceScannerPage } from '@/pages/admin/AttendanceScannerPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';

const router = createBrowserRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/events/:slug', element: <EventDetailPage /> },
      { path: '/events/:slug/register', element: <RegisterPage /> },
      { path: '/registration/success', element: <RegistrationSuccessPage /> },
      { path: '/registration/:id/qr', element: <QRViewPage /> },
    ],
  },

  // Admin auth
  { path: '/admin/login', element: <LoginPage /> },

  // Admin protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <DashboardPage /> },
          { path: '/admin/events', element: <EventsPage /> },
          { path: '/admin/registrations', element: <RegistrationsPage /> },
          { path: '/admin/attendance', element: <AttendanceScannerPage /> },
          { path: '/admin/reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
