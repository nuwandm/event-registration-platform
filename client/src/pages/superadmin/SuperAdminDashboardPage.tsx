import { useQuery } from '@tanstack/react-query';
import { Building2, Clock, CheckCircle2, Ban, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { tenantApi } from '@/api/tenantApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: number; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => tenantApi.superAdmin.getStats(),
    staleTime: 60_000,
  });

  const tenants = data?.data.data?.tenants;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Monitor all organizations and platform activity"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !tenants ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-12" /></div>
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Organizations" value={tenants.total} icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard label="Pending Approval" value={tenants.pending} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-500" />
            <StatCard label="Active" value={tenants.active} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard label="Suspended" value={tenants.suspended} icon={Ban} iconBg="bg-red-50" iconColor="text-red-500" />
          </>
        )}
      </div>

      {tenants && tenants.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-800">{tenants.pending} organization{tenants.pending !== 1 ? 's' : ''} pending approval</p>
              <p className="text-sm text-amber-600">Review and approve or reject new signups</p>
            </div>
          </div>
          <Link to="/superadmin/tenants?status=pending">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-white">Review now</Button>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-slate-800">Organizations</p>
          <Link to="/superadmin/tenants">
            <Button variant="outline" size="sm">View all</Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span>Manage and monitor all tenant organizations from the Organizations page.</span>
        </div>
      </div>
    </div>
  );
}
