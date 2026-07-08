import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Ban, Search, Building2,
  ChevronLeft, ChevronRight, MoreVertical,
} from 'lucide-react';

import { tenantApi } from '@/api/tenantApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Tenant, TenantStatus } from '@/types';

const STATUS_COLORS: Record<TenantStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-100 text-red-600 border-red-200',
};

function TenantRow({ tenant, onApprove, onReject, onSuspend }: {
  tenant: Tenant;
  onApprove: (t: Tenant) => void;
  onReject: (t: Tenant) => void;
  onSuspend: (t: Tenant) => void;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="w-8 h-8 rounded-lg object-contain bg-slate-100 border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-800 text-sm">{tenant.name}</p>
            <p className="text-xs text-slate-400">/{tenant.slug}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">{tenant.contactEmail}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[tenant.status]}`}>
          {tenant.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-slate-400">
        {new Date(tenant.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tenant.status === 'pending' && (
              <>
                <DropdownMenuItem
                  className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 gap-2"
                  onClick={() => onApprove(tenant)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
                  onClick={() => onReject(tenant)}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {tenant.status === 'active' && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
                onClick={() => onSuspend(tenant)}
              >
                <Ban className="w-4 h-4" /> Suspend
              </DropdownMenuItem>
            )}
            {tenant.status === 'suspended' && (
              <DropdownMenuItem
                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 gap-2"
                onClick={() => onApprove(tenant)}
              >
                <CheckCircle2 className="w-4 h-4" /> Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function TenantsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [approveTarget, setApproveTarget] = useState<Tenant | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Tenant | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-tenants', page, status, search],
    queryFn: () =>
      tenantApi.superAdmin.getAll({
        page,
        limit: 15,
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      }),
    staleTime: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['superadmin-tenants'] });
    qc.invalidateQueries({ queryKey: ['platform-stats'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => tenantApi.superAdmin.approve(id),
    onSuccess: () => { invalidate(); setApproveTarget(null); toast({ title: 'Organization approved' }); },
    onError: () => toast({ title: 'Failed to approve', variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => tenantApi.superAdmin.reject(id, note),
    onSuccess: () => { invalidate(); setRejectTarget(null); setRejectNote(''); toast({ title: 'Organization rejected' }); },
    onError: () => toast({ title: 'Failed to reject', variant: 'destructive' }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => tenantApi.superAdmin.suspend(id),
    onSuccess: () => { invalidate(); setSuspendTarget(null); toast({ title: 'Organization suspended' }); },
    onError: () => toast({ title: 'Failed to suspend', variant: 'destructive' }),
  });

  const tenants: Tenant[] = data?.data.data?.data ?? [];
  const total = data?.data.data?.total ?? 0;
  const totalPages = data?.data.data?.totalPages ?? 1;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Organizations" description="Manage tenant organizations on the platform" />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400 ml-auto">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4" />
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                    No organizations found
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <TenantRow
                    key={t._id}
                    tenant={t}
                    onApprove={setApproveTarget}
                    onReject={setRejectTarget}
                    onSuspend={setSuspendTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approve dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{approveTarget?.name}</strong> will be activated and their admin will be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => approveTarget && approveMutation.mutate(approveTarget._id)}
              disabled={approveMutation.isPending}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectNote(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject organization</AlertDialogTitle>
            <AlertDialogDescription>
              Rejecting <strong>{rejectTarget?.name}</strong>. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label htmlFor="rejectNote" className="text-sm font-medium text-slate-700">Reason</Label>
            <Textarea
              id="rejectNote"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Explain why this organization is being rejected..."
              className="mt-1.5 text-sm"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget._id, note: rejectNote })}
              disabled={rejectMutation.isPending || !rejectNote.trim()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend dialog */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{suspendTarget?.name}</strong> will be suspended. Their admins and staff will not be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => suspendTarget && suspendMutation.mutate(suspendTarget._id)}
              disabled={suspendMutation.isPending}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
