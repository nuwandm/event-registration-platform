import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ScanLine, CheckCircle2, XCircle, AlertCircle, Camera, CameraOff,
  User, Hash, Building2, Clock, RefreshCw, CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';

import { attendanceApi, type ScanResult } from '@/api/attendanceApi';
import { eventsApi } from '@/api/eventsApi';
import { useQRScanner } from '@/hooks/useQRScanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';

const SCANNER_ELEMENT_ID = 'qr-scanner-viewport';

// ── Scan result card ──────────────────────────────────────────────────────────
function ScanResultCard({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  const isSuccess = result.outcome === 'success';
  const isDuplicate = result.outcome === 'duplicate';
  const isInvalid = result.outcome === 'invalid';

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
      {/* Header strip */}
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
                <InfoCell icon={CalendarDays} label="Event" value={result.event.name} />
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
      <p className="text-sm font-semibold text-slate-700 break-all">{value}</p>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function AttendanceScannerPage() {
  const { admin } = useAuthStore();
  const isStaff = admin?.role === 'staff';
  const [selectedEventId, setSelectedEventId] = useState<string>(
    isStaff && admin.assignedEvents.length === 1 ? admin.assignedEvents[0] : ''
  );

  const { data: eventsData } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => eventsApi.getAll({ limit: 100 }),
    enabled: !isStaff,
  });

  const allEvents = eventsData?.data.data?.data ?? [];

  // For staff: fetch only their assigned event names
  const { data: staffEventsData } = useQuery({
    queryKey: ['staff-assigned-events', admin?.assignedEvents],
    queryFn: () => eventsApi.getAll({ limit: 100 }),
    enabled: isStaff,
  });

  const staffEvents = (staffEventsData?.data.data?.data ?? []).filter((ev) =>
    admin?.assignedEvents.includes(ev._id)
  );

  const availableEvents = isStaff ? staffEvents : allEvents;

  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  const { mutate: submitScan, isPending } = useMutation({
    mutationFn: (qrData: string) => attendanceApi.scan(qrData, selectedEventId || undefined),
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
      // Pause scanner while showing result
      scanner.pause();
    },
    onError: () => {
      setLastResult({ outcome: 'invalid', message: 'Server error — please try again' });
      scanner.pause();
    },
  });

  const handleScan = useCallback((data: string) => {
    // Debounce: ignore the same QR within 3 seconds
    if (cooldownRef.current || data === lastScannedRef.current) return;
    lastScannedRef.current = data;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    submitScan(data);
  }, [submitScan]);

  const scanner = useQRScanner(SCANNER_ELEMENT_ID, {
    onScan: handleScan,
  });

  const handleReset = useCallback(() => {
    setLastResult(null);
    lastScannedRef.current = null;
    scanner.resume();
  }, [scanner]);

  // Auto-start scanner on mount
  useEffect(() => {
    scanner.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isScanning = scanner.state === 'scanning';

  // Staff must select an event before scanning
  const canScan = !isStaff || !!selectedEventId;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Attendance Scanner"
        description="Scan participant QR codes to mark attendance"
      />

      {/* Event selector */}
      {(isStaff && admin.assignedEvents.length > 1) || !isStaff ? (
        <div className="mb-5 bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            className="flex-1 text-sm bg-transparent outline-none text-slate-700"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">
              {isStaff ? 'Select your assigned event…' : 'All events (no filter)'}
            </option>
            {availableEvents.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.name}
              </option>
            ))}
          </select>
          {selectedEventId && (
            <button
              onClick={() => { if (!isStaff) setSelectedEventId(''); }}
              className="text-slate-400 hover:text-slate-600"
            >
              {!isStaff && <XCircle className="w-4 h-4" />}
            </button>
          )}
        </div>
      ) : isStaff && admin.assignedEvents.length === 1 && availableEvents.length === 1 ? (
        <div className="mb-5 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700 font-medium">{availableEvents[0]?.name}</p>
        </div>
      ) : null}

      {/* Staff warning if no event selected */}
      {isStaff && !selectedEventId && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">Select an event above before scanning</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Camera viewport */}
            <div className="relative bg-black aspect-square">
              {/* html5-qrcode mounts here */}
              <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

              {/* Overlay frame */}
              {isScanning && !lastResult && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    {/* Corner brackets */}
                    {[
                      'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
                      'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
                      'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
                      'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-blue-400 ${cls}`} />
                    ))}
                    {/* Scan line */}
                    <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-400/80 animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
              )}

              {/* Idle overlay */}
              {scanner.state === 'idle' || scanner.state === 'stopped' ? (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-4">
                  <CameraOff className="w-12 h-12 text-slate-400" />
                  <p className="text-slate-300 text-sm">Camera not started</p>
                  <Button onClick={scanner.start} size="sm" disabled={!canScan}>
                    <Camera className="w-4 h-4 mr-2" /> Start Camera
                  </Button>
                </div>
              ) : scanner.state === 'error' ? (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <XCircle className="w-10 h-10 text-red-300" />
                  <p className="text-red-200 text-sm">{scanner.errorMessage}</p>
                  <Button onClick={scanner.start} size="sm" variant="outline" className="border-red-300 text-red-200 hover:bg-red-800">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              ) : scanner.state === 'starting' ? (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting camera…
                  </div>
                </div>
              ) : null}
            </div>

            {/* Scanner controls */}
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

          {/* Instructions */}
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
        </div>

        {/* Right: Result + recent scans */}
        <div className="space-y-4">
          {/* Scan result */}
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

          {/* Recent scans */}
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

          {/* Session stats */}
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
    </div>
  );
}
