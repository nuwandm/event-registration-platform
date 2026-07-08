import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ScanLine, CheckCircle2, XCircle, AlertCircle, Camera, CameraOff,
  User, Hash, Building2, Clock, RefreshCw, CalendarDays, Pencil,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { type ScanResult } from '@/api/attendanceApi';
import { useTenant } from '@/context/TenantContext';
import { useQRScanner } from '@/hooks/useQRScanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Registration } from '@/types';

const SCANNER_ELEMENT_ID = 'qr-scanner-viewport';

// ── Scan result card ──────────────────────────────────────────────────────────
function ScanResultCard({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  const isSuccess = result.outcome === 'success';
  const isDuplicate = result.outcome === 'duplicate';

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      headerBg: 'bg-emerald-500',
      title: 'Check-In Successful',
      badge: <Badge variant="success">✓ Admitted</Badge>,
    },
    duplicate: {
      bg: 'bg-amber-50 border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      headerBg: 'bg-amber-500',
      title: 'Already Checked In',
      badge: <Badge variant="warning">Already Checked In</Badge>,
    },
    invalid: {
      bg: 'bg-red-50 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-500',
      headerBg: 'bg-red-500',
      title: 'Invalid QR Code',
      badge: <Badge variant="destructive">Invalid</Badge>,
    },
  }[result.outcome];

  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-lg ${config.bg} animate-fade-in`}>
      <div className={`${config.headerBg} px-5 py-3 flex items-center gap-3`}>
        <Icon className="w-6 h-6 text-white" />
        <h3 className="text-white font-bold text-lg">{config.title}</h3>
      </div>

      <div className="p-5">
        {result.registration ? (
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg leading-tight">{result.registration.fullName}</p>
                <p className="text-slate-500 text-sm">{result.registration.email}</p>
                {config.badge}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white rounded-xl p-4 border border-slate-100">
              <InfoCell icon={Hash} label="Reg. No." value={result.registration.registrationNumber} />
              <InfoCell icon={Building2} label="NIC / Passport" value={result.registration.nic} />
              {result.registration.organization && (
                <InfoCell icon={Building2} label="Organization" value={result.registration.organization} />
              )}
              {result.event?.name && (
                <div className="col-span-2">
                  <InfoCell icon={CalendarDays} label="Event" value={result.event.name} />
                </div>
              )}
              {isDuplicate && result.registration.attendanceTime && (
                <div className="col-span-2">
                  <InfoCell
                    icon={Clock}
                    label="Previous Check-In"
                    value={format(new Date(result.registration.attendanceTime), 'MMM d, yyyy · h:mm a')}
                  />
                </div>
              )}
              {isSuccess && (
                <div className="col-span-2">
                  <InfoCell
                    icon={Clock}
                    label="Check-In Time"
                    value={format(new Date(), 'MMM d, yyyy · h:mm a')}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-600 mb-5 text-sm">{result.message}</p>
        )}

        <Button onClick={onReset} className="w-full" variant={isSuccess ? 'default' : 'outline'}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Scan Next
        </Button>
      </div>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 wrap-break-word">{value}</p>
    </div>
  );
}

// ── Recent scans list ──────────────────────────────────────────────────────────
interface RecentScan {
  id: string;
  outcome: ScanResult['outcome'];
  name: string;
  regNumber: string;
  time: Date;
}

// ── Manual Attendance Tab ─────────────────────────────────────────────────────
const REG_BADGE: Record<string, 'pending' | 'success' | 'destructive'> = {
  pending: 'pending', approved: 'success', rejected: 'destructive',
};

function ManualAttendanceTab({ eventId }: { eventId: string }) {
  const { api } = useTenant();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['manual-attendance', eventId, page, search],
    queryFn: () => api.registrations.getAll({ eventId, page, limit: 15, status: 'approved', search: search || undefined }),
    select: (res) => res.data.data,
    enabled: !!eventId,
  });

  const markMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'attended' | 'not_attended' }) =>
      api.registrations.update(id, { attendanceStatus: status }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'attended' ? 'Marked as attended' : 'Unmarked attendance');
      qc.invalidateQueries({ queryKey: ['manual-attendance', eventId] });
    },
    onError: () => toast.error('Failed to update attendance'),
  });

  const registrations: Registration[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  if (!eventId) {
    return (
      <div className="py-16 text-center text-slate-400">
        <Pencil className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-slate-500 mb-1">Select an event first</p>
        <p className="text-sm">Choose an event from the dropdown above to mark attendance manually.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search by name, NIC, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Search</Button>
      </form>

      <p className="text-xs text-slate-400">{total} approved participant{total !== 1 ? 's' : ''}</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : registrations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No approved participants found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Participant</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden sm:table-cell">Ref. No.</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Attendance</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {registrations.map((reg) => {
                const attended = reg.attendanceStatus === 'attended';
                const isPending = markMutation.isPending && markMutation.variables?.id === reg._id;
                return (
                  <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-sm">{reg.fullName}</p>
                      <p className="text-xs text-slate-400">{reg.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-500">{reg.registrationNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      {attended ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Not yet
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={isPending}
                        onClick={() => markMutation.mutate({ id: reg._id, status: attended ? 'not_attended' : 'attended' })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          attended
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {isPending ? '…' : attended ? 'Unmark' : 'Mark Attended'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

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
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const MODES = ['QR Scanner', 'Manual'] as const;
type Mode = typeof MODES[number];

export function AttendanceScannerPage() {
  const { api } = useTenant();
  const { admin } = useAuthStore();
  const isStaff = admin?.role === 'staff';
  const [mode, setMode] = useState<Mode>('QR Scanner');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    isStaff && admin.assignedEvents.length === 1 ? admin.assignedEvents[0] : ''
  );

  const { data: eventsData } = useQuery({
    queryKey: ['all-events-attendance'],
    queryFn: () => api.events.getAll({ limit: 100 }),
    enabled: !isStaff,
  });

  const allEvents = eventsData?.data.data?.data ?? [];

  const { data: staffEventsData } = useQuery({
    queryKey: ['staff-assigned-events', admin?.assignedEvents],
    queryFn: () => api.events.getAll({ limit: 100 }),
    enabled: isStaff,
  });

  const staffEvents = (staffEventsData?.data.data?.data ?? []).filter((ev) =>
    admin?.assignedEvents.includes(ev._id)
  );

  const availableEvents = isStaff ? staffEvents : allEvents;
  const selectedEvent = availableEvents.find((ev) => ev._id === selectedEventId);

  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  const { mutate: submitScan, isPending } = useMutation({
    mutationFn: (qrData: string) => api.attendance.scan(qrData, selectedEventId || undefined),
    onSuccess: (res) => {
      const result = res.data.data!;
      setLastResult(result);
      if (result.registration) {
        setRecentScans((prev) => [
          {
            id: result.registration!.id,
            outcome: result.outcome,
            name: result.registration!.fullName,
            regNumber: result.registration!.registrationNumber,
            time: new Date(),
          },
          ...prev.slice(0, 19),
        ]);
      }
      scanner.pause();
    },
    onError: () => {
      setLastResult({ outcome: 'invalid', message: 'Server error — please try again' });
      scanner.pause();
    },
  });

  const handleScan = useCallback((data: string) => {
    if (cooldownRef.current || data === lastScannedRef.current) return;
    lastScannedRef.current = data;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);
    submitScan(data);
  }, [submitScan]);

  const scanner = useQRScanner(SCANNER_ELEMENT_ID, { onScan: handleScan });

  const handleReset = useCallback(() => {
    setLastResult(null);
    lastScannedRef.current = null;
    scanner.resume();
  }, [scanner]);

  useEffect(() => {
    scanner.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isScanning = scanner.state === 'scanning';
  const canScan = !isStaff || !!selectedEventId;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Attendance"
        description="Scan QR codes or mark attendance manually"
      />

      {/* Event selector — shadcn Select */}
      {((isStaff && admin.assignedEvents.length > 1) || !isStaff) && (
        <div className="mb-5 bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          <Select
            value={selectedEventId || '__all__'}
            onValueChange={(v) => setSelectedEventId(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="flex-1 border-0 shadow-none focus:ring-0 px-0 h-auto text-sm text-slate-700 bg-transparent">
              <SelectValue placeholder={isStaff ? 'Select your assigned event…' : 'All events (no filter)'} />
            </SelectTrigger>
            <SelectContent>
              {!isStaff && (
                <SelectItem value="__all__">All events (no filter)</SelectItem>
              )}
              {availableEvents.map((ev) => (
                <SelectItem key={ev._id} value={ev._id}>{ev.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Staff: single event pill */}
      {isStaff && admin.assignedEvents.length === 1 && availableEvents.length === 1 && (
        <div className="mb-5 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700 font-medium">{availableEvents[0]?.name}</p>
        </div>
      )}

      {isStaff && !selectedEventId && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">Select an event above before scanning</p>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m === 'QR Scanner' ? (
              <span className="flex items-center gap-1.5"><ScanLine className="w-3.5 h-3.5" />QR Scanner</span>
            ) : (
              <span className="flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" />Manual</span>
            )}
          </button>
        ))}
      </div>

      {/* Manual tab */}
      {mode === 'Manual' && <ManualAttendanceTab eventId={selectedEventId} />}

      {/* QR Scanner tab */}
      {mode === 'QR Scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Camera panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative bg-black aspect-square">
                <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

                {isScanning && !lastResult && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-52 h-52">
                      {[
                        'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
                        'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
                        'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
                        'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 border-blue-400 ${cls}`} />
                      ))}
                      <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-400/80 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                  </div>
                )}

                {(scanner.state === 'idle' || scanner.state === 'stopped') && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-4">
                    <CameraOff className="w-12 h-12 text-slate-400" />
                    <p className="text-slate-300 text-sm">Camera not started</p>
                    <Button onClick={scanner.start} size="sm" disabled={!canScan}>
                      <Camera className="w-4 h-4 mr-2" /> Start Camera
                    </Button>
                  </div>
                )}
                {scanner.state === 'error' && (
                  <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <XCircle className="w-10 h-10 text-red-300" />
                    <p className="text-red-200 text-sm">{scanner.errorMessage}</p>
                    <Button onClick={scanner.start} size="sm" variant="outline" className="border-red-300 text-red-200 hover:bg-red-800">
                      <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                  </div>
                )}
                {scanner.state === 'starting' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting camera…
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-500 capitalize">
                    {isPending ? 'Processing…' : scanner.state === 'scanning' ? 'Ready to scan' : scanner.state}
                  </span>
                </div>
                <div className="flex gap-2">
                  {isScanning && (
                    <Button size="sm" variant="outline" onClick={scanner.stop}>
                      <CameraOff className="w-3.5 h-3.5 mr-1.5" /> Stop
                    </Button>
                  )}
                  {(scanner.state === 'stopped' || scanner.state === 'idle') && (
                    <Button size="sm" onClick={scanner.start} disabled={!canScan}>
                      <Camera className="w-3.5 h-3.5 mr-1.5" /> Start
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {!lastResult && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <ScanLine className="w-4 h-4" /> How to scan
                </p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Ask the participant to open their QR code</li>
                  <li>Hold the QR code steady within the frame</li>
                  <li>The scanner will detect and validate automatically</li>
                  <li>Green = admitted · Orange = already scanned · Red = invalid</li>
                </ol>
              </div>
            )}

            {/* Selected event info */}
            {selectedEvent && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-500">
                Scanning for: <span className="font-semibold text-slate-700">{selectedEvent.name}</span>
              </div>
            )}
          </div>

          {/* Right: Result + recent scans */}
          <div className="space-y-4">
            {lastResult ? (
              <ScanResultCard result={lastResult} onReset={handleReset} />
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <ScanLine className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">Scan result will appear here</p>
              </div>
            )}

            {recentScans.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Recent Scans</p>
                  <span className="text-xs text-slate-400">{recentScans.length} this session</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {recentScans.map((scan, i) => (
                    <div key={`${scan.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        scan.outcome === 'success' ? 'bg-emerald-500' :
                        scan.outcome === 'duplicate' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{scan.name}</p>
                        <p className="text-xs text-slate-400">{scan.regNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{format(scan.time, 'h:mm a')}</p>
                        <p className={`text-xs font-medium capitalize ${
                          scan.outcome === 'success' ? 'text-emerald-600' :
                          scan.outcome === 'duplicate' ? 'text-amber-600' : 'text-red-600'
                        }`}>{scan.outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentScans.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Admitted', count: recentScans.filter(s => s.outcome === 'success').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Duplicate', count: recentScans.filter(s => s.outcome === 'duplicate').length, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  { label: 'Invalid', count: recentScans.filter(s => s.outcome === 'invalid').length, color: 'text-red-600 bg-red-50 border-red-100' },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs font-medium">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
