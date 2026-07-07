import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { format } from 'date-fns';

import { registrationsApi } from '@/api/registrationsApi';
import type { Registration } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { RegistrationDetailSheet } from '@/components/admin/RegistrationDetailSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'attended', label: 'Attended' },
  { value: 'not_attended', label: 'Not Attended' },
] as const;

const STATUS_BADGE: Record<string, 'pending' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'destructive',
};

const ATTENDANCE_BADGE: Record<string, 'success' | 'secondary'> = {
  attended: 'success',
  not_attended: 'secondary',
};

// ── Page ──────────────────────────────────────────────────────────────────────
export function RegistrationsPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-registrations', page, activeTab, search],
    queryFn: () =>
      registrationsApi.getAll({
        page,
        limit: 15,
        status: activeTab || undefined,
        search: search || undefined,
      }),
    select: (res) => res.data.data,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
    setSearchInput('');
  };

  const registrations = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Registrations"
        description={`${total} registration${total !== 1 ? 's' : ''} found`}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name, NIC, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Search</Button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No registrations found"
            description={search || activeTab ? 'Try adjusting your filters' : 'No registrations yet'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Registrant</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Reg. Number</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden xl:table-cell">Attendance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => {
                  const eventName =
                    reg.eventId && typeof reg.eventId === 'object' && 'name' in reg.eventId
                      ? (reg.eventId as { name: string }).name
                      : '—';

                  return (
                    <tr
                      key={reg._id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(reg._id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 leading-tight">{reg.fullName}</p>
                          <p className="text-xs text-slate-400">{reg.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                          {reg.registrationNumber}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-50 truncate text-xs">
                        {eventName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell whitespace-nowrap">
                        {format(new Date(reg.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[reg.status] ?? 'secondary'} className="capitalize text-xs">
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {reg.status === 'approved' && (
                          <Badge variant={ATTENDANCE_BADGE[reg.attendanceStatus] ?? 'secondary'} className="text-xs capitalize">
                            {reg.attendanceStatus === 'attended' ? 'Attended' : 'Not Attended'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setSelectedId(reg._id); }}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <RegistrationDetailSheet
        registrationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
