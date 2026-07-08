import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, CalendarDays, Search, ChevronLeft, ChevronRight,
  UserCog, X, Link2, Copy, Check, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

import { eventsApi } from '@/api/eventsApi';
import { usersApi } from '@/api/usersApi';
import type { Event, StaffUser } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventFormDialog } from '@/components/admin/EventFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── Share Dialog ──────────────────────────────────────────────────────────────
function ShareDialog({ event, onClose }: { event: Event; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const registrationUrl = `${window.location.origin}/events/${event.slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Share Registration Link</h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">{event.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Share this link with participants so they can view the event details and register.
          </p>

          {/* URL box */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="flex-1 text-sm text-slate-700 truncate font-mono">{registrationUrl}</p>
            <button
              onClick={copy}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Copied!</span></>
                : <><Copy className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-600">Copy</span></>
              }
            </button>
          </div>

          {/* Open in browser */}
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in browser
          </a>

          <Button className="w-full" onClick={copy}>
            {copied ? <><Check className="w-4 h-4 mr-2" />Link Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Link</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Staff Dialog ───────────────────────────────────────────────────────
function ManageStaffDialog({ event, onClose }: { event: Event; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: allStaffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => usersApi.list(),
  });

  const { data: assignedData } = useQuery({
    queryKey: ['event-staff', event._id],
    queryFn: () => usersApi.getEventStaff(event._id),
  });

  const allStaff: StaffUser[] = allStaffData?.data.data?.users ?? [];
  const assignedIds = new Set((assignedData?.data.data?.staff ?? []).map((s) => s._id));
  const [selected, setSelected] = useState<Set<string>>(assignedIds);

  // Sync once assigned data loads
  if (assignedData && selected.size === 0 && assignedIds.size > 0) {
    setSelected(new Set(assignedIds));
  }

  const saveMutation = useMutation({
    mutationFn: () => usersApi.setEventStaff(event._id, [...selected]),
    onSuccess: () => {
      toast.success('Staff updated');
      qc.invalidateQueries({ queryKey: ['event-staff', event._id] });
      qc.invalidateQueries({ queryKey: ['staff-users'] });
      onClose();
    },
    onError: () => toast.error('Failed to update staff'),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Manage Staff</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{event.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {staffLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : allStaff.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No staff users yet. Create staff users from the User Management page first.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-lg divide-y max-h-64 overflow-y-auto mb-5">
              {allStaff.map((staff) => (
                <label
                  key={staff._id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.has(staff._id)}
                    onChange={() => toggle(staff._id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{staff.name}</p>
                    <p className="text-xs text-slate-400 truncate">{staff.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1"
              disabled={saveMutation.isPending || allStaff.length === 0}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  published: 'success',
  draft: 'warning',
  closed: 'secondary',
};

export function EventsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [staffEvent, setStaffEvent] = useState<Event | null>(null);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', page, search, statusFilter],
    queryFn: () => eventsApi.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined }),
    select: (res) => res.data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setDeletingEvent(null);
    },
    onError: () => toast.error('Failed to delete event'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openCreate = () => { setEditingEvent(null); setFormOpen(true); };
  const openEdit = (event: Event) => { setEditingEvent(event); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingEvent(null); };

  const events = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Events"
        description={`${total} event${total !== 1 ? 's' : ''} total`}
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Event
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events found"
            description={search || statusFilter ? 'Try adjusting your filters' : 'Create your first event to get started'}
            action={!search && !statusFilter ? <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Create Event</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Venue</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Fee</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Registrations</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {event.bannerImage ? (
                          <img src={event.bannerImage} alt={event.name} className="w-10 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800 leading-tight">{event.name}</p>
                          <p className="text-xs text-slate-400">/{event.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-[180px] truncate">{event.venue}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                      {format(new Date(event.eventDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-slate-700 hidden sm:table-cell font-medium">
                      {event.registrationFee === 0 ? 'Free' : `LKR ${event.registrationFee.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[event.status] ?? 'secondary'} className="capitalize">
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {event.registrationCount}
                      {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setShareEvent(event)} title="Share registration link"
                          className="text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                          <Link2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setStaffEvent(event)} title="Manage Staff">
                          <UserCog className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingEvent(event)} title="Delete"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
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

      {/* Create / Edit Dialog */}
      <EventFormDialog open={formOpen} onClose={closeForm} event={editingEvent} />

      {/* Share Dialog */}
      {shareEvent && <ShareDialog event={shareEvent} onClose={() => setShareEvent(null)} />}

      {/* Manage Staff Dialog */}
      {staffEvent && <ManageStaffDialog event={staffEvent} onClose={() => setStaffEvent(null)} />}

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingEvent?.name}</strong>? This action cannot be undone.
              All associated data including registrations may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingEvent && deleteMutation.mutate(deletingEvent._id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
