import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/superadmin/tenants', label: 'Organizations', icon: Building2, exact: false },
];

export function SuperAdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login');
  };

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-700">
        <Link to="/" className="flex items-center">
          <img src="/Event Hub.png" alt="EventHub" className="h-9 w-auto object-contain brightness-0 invert" />
        </Link>
        <p className="text-xs text-amber-400 mt-1 font-semibold">Super Admin</p>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(to, exact)
                ? 'bg-amber-500 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-white truncate">{admin?.name}</p>
          <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="hidden lg:flex lg:w-64 bg-slate-800 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-sm font-semibold text-slate-700 flex-1">
            {navItems.find((n) => isActive(n.to, n.exact))?.label ?? 'Super Admin'}
          </h1>
          <span className="hidden sm:block text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            Platform Admin
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
