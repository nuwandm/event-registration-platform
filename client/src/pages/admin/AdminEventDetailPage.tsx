import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, CalendarDays, MapPin, CreditCard, Users, Building2,
  Pencil, Trash2, Link2, UserCog, DoorOpen, DoorClosed,
  CheckCircle2, Clock, Eye, Search, ChevronLeft, ChevronRight,
  SquarePen, Copy, Check, BarChart2, ListPlus, Plus, X,
} from 'lucide-react';
import { format } from 'date-fns';

import { useTenant } from '@/context/TenantContext';
import type { Registration, StaffUser, Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EventFormDialog } from '@/components/admin/EventFormDialog';
import { RegistrationDetailSheet } from '@/components/admin/RegistrationDetailSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Details', 'Participants', 'Responses', 'Questionnaire', 'Staff'] as const;
type Tab = typeof TABS[number];

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  published: 'success', draft: 'warning', closed: 'secondary',
};

const REG_BADGE: Record<string, 'pending' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'pending', approved: 'success', rejected: 'destructive',
};

const STATUS_REG_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'attended', label: 'Attended' },
] as const;

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminEventDetailPage() {
  const { api, orgSlug } = useTenant();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const qc = useQueryClient();

  const initialTab = (urlParams.get('tab') as Tab) ?? 'Details';
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? initialTab : 'Details');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ── Event ──────────────────────────────────────────────────────────────────
  const { data: event, isLoading } = useQuery({
    queryKey: ['admin-event-detail', id],
    queryFn: () => api.events.getById(id!),
    select: (res) => res.data.data?.event,
    enabled: !!id,
  });

  const admissionMutation = useMutation({
    mutationFn: () => api.events.toggleAdmission(id!),
    onSuccess: (res) => {
      const ev = res.data.data?.event;
      toast.success(ev?.admissionOpen ? 'Admission opened — QR scanning is now live' : 'Admission closed');
      qc.invalidateQueries({ queryKey: ['admin-event-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: () => toast.error('Failed to toggle admission'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.events.delete(id!),
    onSuccess: () => {
      toast.success('Event deleted');
      navigate(`/${orgSlug}/admin/events`);
    },
    onError: () => toast.error('Failed to delete event'),
  });

  if (isLoading) return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  if (!event) return (
    <div className="p-8 text-center text-slate-500">Event not found. <Link to={`/${orgSlug}/admin/events`} className="text-blue-600 hover:underline">Back to events</Link></div>
  );

  const isRegistrationOpen = new Date() >= new Date(event.registrationOpenDate) && new Date() <= new Date(event.registrationCloseDate);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <button onClick={() => navigate(`/${orgSlug}/admin/events`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {event.admissionOpen && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Admission Live
            </span>
          )}
          <Button
            size="sm"
            variant={event.admissionOpen ? 'outline' : 'default'}
            className={event.admissionOpen ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            onClick={() => admissionMutation.mutate()}
            disabled={admissionMutation.isPending}
          >
            {event.admissionOpen ? <><DoorClosed className="w-3.5 h-3.5 mr-1.5" />Close Admission</> : <><DoorOpen className="w-3.5 h-3.5 mr-1.5" />Open Admission</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Banner */}
      {event.bannerImage && (
        <div className="relative rounded-2xl overflow-hidden mb-6 max-h-52">
          <img src={event.bannerImage} alt={event.name} className="w-full h-52 object-cover"
            style={event.bannerPosition ? { objectPosition: `${event.bannerPosition.x}% ${event.bannerPosition.y}%` } : undefined}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">{event.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATUS_BADGE[event.status] ?? 'secondary'} className="capitalize">{event.status}</Badge>
                {isRegistrationOpen && <Badge variant="success">Registration Open</Badge>}
              </div>
            </div>
            <div className="text-white/80 text-sm text-right">
              <p className="font-bold text-white text-lg">{event.registrationCount}</p>
              <p className="text-xs">registered</p>
            </div>
          </div>
        </div>
      )}

      {/* Title (no banner) */}
      {!event.bannerImage && (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{event.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={STATUS_BADGE[event.status] ?? 'secondary'} className="capitalize">{event.status}</Badge>
                {isRegistrationOpen && <Badge variant="success">Registration Open</Badge>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-slate-800">{event.registrationCount}</p>
              <p className="text-xs text-slate-400">registrations</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
            {t === 'Participants' && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{event.registrationCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Details' && <DetailsTab event={event} orgSlug={orgSlug} />}
      {tab === 'Participants' && <ParticipantsTab eventId={id!} />}
      {tab === 'Responses' && <ResponsesTab eventId={id!} questions={event.questions ?? []} />}
      {tab === 'Questionnaire' && <QuestionnaireTab event={event} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-event-detail', id] })} />}
      {tab === 'Staff' && <StaffTab eventId={id!} eventName={event.name} />}

      {/* Edit dialog */}
      <EventFormDialog open={editOpen} onClose={() => { setEditOpen(false); qc.invalidateQueries({ queryKey: ['admin-event-detail', id] }); }} event={event} />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{event.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Details tab ───────────────────────────────────────────────────────────────
function DetailsTab({ event, orgSlug }: { event: import('@/types').Event; orgSlug: string }) {
  const [copied, setCopied] = useState(false);
  const registrationUrl = `${window.location.origin}/${orgSlug}/events/${event.slug}/register`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={CalendarDays} label="Event Date" color="blue"
          value={format(new Date(event.eventDate), 'MMM d, yyyy')}
          sub={format(new Date(event.eventDate), 'h:mm a')} />
        <InfoCard icon={MapPin} label="Venue" color="violet" value={event.venue} />
        <InfoCard icon={CreditCard} label="Fee" color="emerald"
          value={event.registrationFee === 0 ? 'Free' : `LKR ${event.registrationFee.toLocaleString()}`} />
        <InfoCard icon={Users} label="Registrations" color="amber"
          value={String(event.registrationCount)}
          sub={event.maxParticipants ? `of ${event.maxParticipants} max` : 'no limit'} />
      </div>

      {/* Registration window */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Registration Window</p>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          {format(new Date(event.registrationOpenDate), 'MMM d, yyyy · h:mm a')}
          <span className="text-slate-300">→</span>
          {format(new Date(event.registrationCloseDate), 'MMM d, yyyy · h:mm a')}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{event.description}</p>
      </div>

      {/* Bank details */}
      {event.registrationFee > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bank Transfer Details</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              ['Bank', event.bankDetails.bankName],
              ['Account Name', event.bankDetails.accountName],
              ['Account No.', event.bankDetails.accountNumber],
              ['Branch', event.bankDetails.branch],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share links */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-blue-500" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Registration Link</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <span className="flex-1 text-xs font-mono text-slate-600 truncate">{registrationUrl}</span>
          <button
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Copied!</span></>
              : <><Copy className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">Copy</span></>
            }
          </button>
        </div>
        <a href={registrationUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
          Open event page ↗
        </a>
      </div>
    </div>
  );
}

// ── Participants tab ───────────────────────────────────────────────────────────
function ParticipantsTab({ eventId }: { eventId: string }) {
  const { api } = useTenant();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Edit state
  const [editTarget, setEditTarget] = useState<Registration | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editAttendance, setEditAttendance] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['event-registrations', eventId, page, activeTab, search],
    queryFn: () => api.registrations.getAll({ page, limit: 15, status: activeTab || undefined, search: search || undefined, eventId }),
    select: (res) => res.data.data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['event-registrations', eventId] });
    qc.invalidateQueries({ queryKey: ['admin-event-detail'] });
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.registrations.remove(deleteTarget!._id, deleteReason),
    onSuccess: () => {
      toast.success('Participant removed');
      setDeleteTarget(null);
      setDeleteReason('');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Failed to delete registration');
    },
  });

  const editMutation = useMutation({
    mutationFn: () => api.registrations.update(editTarget!._id, {
      status: editStatus || undefined,
      attendanceStatus: editAttendance || undefined,
      adminRemarks: editRemarks || undefined,
    }),
    onSuccess: () => {
      toast.success('Participant updated');
      setEditTarget(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Failed to update registration');
    },
  });

  const openEdit = (reg: Registration) => {
    setEditTarget(reg);
    setEditStatus(reg.status);
    setEditAttendance(reg.attendanceStatus);
    setEditRemarks(reg.adminRemarks ?? '');
  };

  const registrations: Registration[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          {STATUS_REG_TABS.map((t) => (
            <button key={t.value} onClick={() => { setActiveTab(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${activeTab === t.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >{t.label}</button>
          ))}
        </div>
        <form className="flex gap-2 flex-1" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search by name, NIC, email…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
      </div>

      <p className="text-xs text-slate-400">{total} participant{total !== 1 ? 's' : ''}</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : registrations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No participants yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden sm:table-cell">Ref. No.</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell">Attendance</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {registrations.map((reg) => (
                <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800 text-sm">{reg.fullName}</p>
                    <p className="text-xs text-slate-400">{reg.email}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="font-mono text-xs text-slate-500">{reg.registrationNumber}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={REG_BADGE[reg.status] ?? 'secondary'} className="capitalize text-xs">{reg.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    {reg.attendanceStatus === 'attended'
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Attended</span>
                      : <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3.5 h-3.5" />Not yet</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 hidden lg:table-cell">
                    {format(new Date(reg.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => setSelectedId(reg._id)} title="View details"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(reg)} title="Edit participant"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors">
                        <SquarePen className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setDeleteTarget(reg); setDeleteReason(''); }} title="Remove participant"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <RegistrationDetailSheet registrationId={selectedId} onClose={() => setSelectedId(null)} />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Remove Participant
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently remove <strong>{deleteTarget?.fullName}</strong> from this event. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Label className="text-sm">Reason for removal <span className="text-red-500">*</span></Label>
            <Textarea
              className="mt-1.5"
              placeholder="e.g. Duplicate registration — same person registered twice under different NICs."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleteReason.trim()) { toast.error('Removal reason is required'); return; }
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? 'Removing…' : 'Remove Participant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SquarePen className="w-4 h-4 text-amber-500" /> Edit Participant
            </DialogTitle>
            <DialogDescription>
              Manually update status, attendance, or remarks for <strong>{editTarget?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Registration status */}
            <div>
              <Label className="text-sm font-medium text-slate-700">Registration Status</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(['pending', 'approved', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                      editStatus === s
                        ? s === 'approved' ? 'bg-emerald-500 text-white border-emerald-500'
                          : s === 'rejected' ? 'bg-red-500 text-white border-red-500'
                          : 'bg-amber-400 text-white border-amber-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance — only meaningful for approved */}
            {editStatus === 'approved' && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Attendance</Label>
                <div className="flex gap-2 mt-2">
                  {(['not_attended', 'attended'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setEditAttendance(a)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        editAttendance === a
                          ? a === 'attended' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-400 text-white border-slate-400'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {a === 'attended' ? 'Attended' : 'Not Attended'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Admin remarks */}
            <div>
              <Label className="text-sm font-medium text-slate-700">Admin Remarks</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Optional notes visible to admin only…"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={editMutation.isPending}
              onClick={() => editMutation.mutate()}
            >
              {editMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Responses tab ─────────────────────────────────────────────────────────────
function ResponsesTab({ eventId, questions }: { eventId: string; questions: Question[] }) {
  const { api } = useTenant();

  const { data, isLoading } = useQuery({
    queryKey: ['event-responses', eventId],
    queryFn: () => api.registrations.getAll({ eventId, limit: 1000 }),
    select: (res) => res.data.data?.data ?? [],
  });

  const registrations: Registration[] = data ?? [];
  const totalResponses = registrations.filter((r) => r.answers && r.answers.length > 0).length;

  if (questions.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-slate-500 mb-1">No questions yet</p>
        <p className="text-sm">Add questions in the Questionnaire tab first.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{totalResponses} response{totalResponses !== 1 ? 's' : ''}</p>
          <p className="text-xs text-slate-400">{questions.length} question{questions.length !== 1 ? 's' : ''} · accepting responses</p>
        </div>
      </div>

      {/* Per-question summary */}
      {questions.map((q, qi) => {
        const allAnswers = registrations
          .flatMap((r) => r.answers ?? [])
          .filter((a) => a.questionId === q._id);

        const answered = allAnswers.length;

        if (q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') {
          // Count occurrences per option
          const counts: Record<string, number> = {};
          allAnswers.forEach((a) => {
            const vals = Array.isArray(a.answer) ? a.answer : [a.answer];
            vals.forEach((v) => { if (v) counts[v] = (counts[v] ?? 0) + 1; });
          });
          const maxCount = Math.max(...Object.values(counts), 1);

          return (
            <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-400 mb-0.5">Question {qi + 1}</p>
              <p className="font-semibold text-slate-800 mb-1">{q.label}</p>
              <p className="text-xs text-slate-400 mb-4">{answered} response{answered !== 1 ? 's' : ''}</p>
              <div className="space-y-3">
                {q.options.map((opt) => {
                  const count = counts[opt] ?? 0;
                  const pct = answered > 0 ? Math.round((count / answered) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">{opt}</span>
                        <span className="text-xs font-semibold text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Text / textarea — show individual responses
        const textAnswers = allAnswers.map((a) => (Array.isArray(a.answer) ? a.answer.join(', ') : String(a.answer ?? ''))).filter(Boolean);
        return (
          <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-400 mb-0.5">Question {qi + 1}</p>
            <p className="font-semibold text-slate-800 mb-1">{q.label}</p>
            <p className="text-xs text-slate-400 mb-4">{answered} response{answered !== 1 ? 's' : ''}</p>
            {textAnswers.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No responses yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {textAnswers.map((ans, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 border border-slate-100">
                    {ans}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Questionnaire tab ─────────────────────────────────────────────────────────
const Q_TYPES: { value: Question['type']; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
];

const NEEDS_OPTIONS: Question['type'][] = ['radio', 'checkbox', 'dropdown'];

function QuestionnaireTab({ event, onSaved }: { event: import('@/types').Event; onSaved: () => void }) {
  const { api } = useTenant();
  const [questions, setQuestions] = useState<Array<Omit<Question, '_id'> & { _id: string }>>(() =>
    (event.questions ?? []).map((q) => ({ ...q, _id: q._id ?? String(Date.now() + Math.random()) }))
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { _id: String(Date.now()), label: '', type: 'text', options: [], required: false },
    ]);
  };

  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = val;
        return { ...q, options: opts };
      })
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q)));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q))
    );
  };

  const save = async () => {
    for (const q of questions) {
      if (!q.label.trim()) { toast.error('All questions must have a label'); return; }
      if (NEEDS_OPTIONS.includes(q.type) && q.options.filter(Boolean).length === 0) {
        toast.error(`"${q.label}" needs at least one option`); return;
      }
    }
    setSaving(true);
    try {
      const payload = { questions: questions.map(({ label, type, options, required }) => ({ label, type, options, required })) };
      await api.events.update(event._id, payload as Record<string, unknown>);
      toast.success('Questions saved');
      onSaved();
    } catch {
      toast.error('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Custom Questions</p>
          <p className="text-xs text-slate-400 mt-0.5">Participants will answer these when registering.</p>
        </div>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Questions'}
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <ListPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No questions yet. Click "Add Question" to start.</p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-3">
                {/* Label */}
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Question Label *</Label>
                  <Input
                    value={q.label}
                    onChange={(e) => updateQuestion(qi, { label: e.target.value })}
                    placeholder="e.g. What is your dietary preference?"
                    className="bg-slate-50"
                  />
                </div>

                {/* Type */}
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Answer Type</Label>
                  <Select value={q.type} onValueChange={(v) => updateQuestion(qi, { type: v as Question['type'], options: [] })}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Q_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                {NEEDS_OPTIONS.includes(q.type) && (
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Options</Label>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          {q.type === 'radio' && <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                          {q.type === 'checkbox' && <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0" />}
                          {q.type === 'dropdown' && <span className="text-xs text-slate-400 w-4 text-center shrink-0">{oi + 1}.</span>}
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            className="bg-white flex-1"
                          />
                          <button type="button" onClick={() => removeOption(qi, oi)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addOption(qi)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1">
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                      {q.options.filter(Boolean).length === 0 && (
                        <p className="text-xs text-amber-500">Add at least one option</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Required */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(qi, { required: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">Required</span>
                </label>
              </div>

              {/* Delete */}
              <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors mt-0.5 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Question
      </button>
    </div>
  );
}

// ── Staff tab ──────────────────────────────────────────────────────────────────
function StaffTab({ eventId, eventName }: { eventId: string; eventName: string }) {
  const { api, orgSlug } = useTenant();
  const qc = useQueryClient();

  const { data: allStaffData, isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => api.users.list(),
  });

  const { data: assignedData } = useQuery({
    queryKey: ['event-staff', eventId],
    queryFn: () => api.users.getEventStaff(eventId),
  });

  const allStaff: StaffUser[] = allStaffData?.data.data?.users ?? [];
  const assignedIds = new Set<string>((assignedData?.data.data?.staff ?? []).map((s: StaffUser) => s._id));
  const [selected, setSelected] = useState<Set<string>>(assignedIds);

  if (assignedData && selected.size === 0 && assignedIds.size > 0) {
    setSelected(new Set<string>(assignedIds));
  }

  const saveMutation = useMutation({
    mutationFn: () => api.users.setEventStaff(eventId, [...selected]),
    onSuccess: () => {
      toast.success('Staff updated');
      qc.invalidateQueries({ queryKey: ['event-staff', eventId] });
    },
    onError: () => toast.error('Failed to update staff'),
  });

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Assigned Staff</p>
            <p className="text-xs text-slate-400 mt-0.5">Staff assigned to <span className="font-medium">{eventName}</span></p>
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <UserCog className="w-3.5 h-3.5 mr-1.5" />
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : allStaff.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <UserCog className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No staff users yet. Create staff from <Link to={`/${orgSlug}/admin/users`} className="text-blue-600 hover:underline">User Management</Link>.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {allStaff.map((staff) => (
              <label key={staff._id} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" className="rounded w-4 h-4" checked={selected.has(staff._id)} onChange={() => toggle(staff._id)} />
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{staff.name}</p>
                  <p className="text-xs text-slate-400 truncate">{staff.email}</p>
                </div>
                {selected.has(staff._id) && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Assigned</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:    { card: 'bg-blue-50 border-blue-100',    icon: 'bg-blue-100 text-blue-600',    label: 'text-blue-500',   value: 'text-blue-900' },
  violet:  { card: 'bg-violet-50 border-violet-100',icon: 'bg-violet-100 text-violet-600',label: 'text-violet-500', value: 'text-violet-900' },
  emerald: { card: 'bg-emerald-50 border-emerald-100',icon:'bg-emerald-100 text-emerald-600',label:'text-emerald-600',value:'text-emerald-900' },
  amber:   { card: 'bg-amber-50 border-amber-100',  icon: 'bg-amber-100 text-amber-600',  label: 'text-amber-600',  value: 'text-amber-900' },
};

function InfoCard({ icon: Icon, label, value, sub, color = 'blue' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-xl border p-3 ${c.card}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${c.icon}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${c.label}`}>{label}</p>
      <p className={`text-sm font-bold leading-snug ${c.value}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 opacity-70 ${c.value}`}>{sub}</p>}
    </div>
  );
}
