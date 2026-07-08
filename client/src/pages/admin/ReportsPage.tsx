import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, FileSpreadsheet, File, Download, Users, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTenant } from '@/context/TenantContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Format = 'csv' | 'excel' | 'pdf';
type RegistrationStatus = 'all' | 'pending' | 'approved' | 'rejected';

const FORMAT_OPTIONS: { value: Format; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'csv', label: 'CSV', icon: FileText, desc: 'Comma-separated values, opens in Excel / Google Sheets' },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, desc: 'Styled .xlsx workbook with color-coded header' },
  { value: 'pdf', label: 'PDF', desc: 'Landscape A4, suitable for printing', icon: File },
];

const STATUS_OPTIONS: { value: RegistrationStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ── Download helper ───────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

async function triggerDownload(url: string, defaultName: string) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/api') ? url.slice(4) : url}`;
  const res = await fetch(fullUrl, {
    headers: {
      Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth-storage') ?? '{}')?.state?.token ?? ''}`,
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message ?? 'Export failed');
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? defaultName;

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ── Format picker ─────────────────────────────────────────────────────────────
function FormatPicker({ value, onChange }: { value: Format; onChange: (v: Format) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FORMAT_OPTIONS.map(({ value: v, label, icon: Icon, desc }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            value === v
              ? 'border-blue-600 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
          }`}
        >
          <Icon className={`w-6 h-6 mb-2 ${value === v ? 'text-blue-600' : 'text-slate-400'}`} />
          <p className={`font-semibold text-sm ${value === v ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
        </button>
      ))}
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onExport: () => Promise<void>;
  exporting: boolean;
  extraFilters?: React.ReactNode;
}

function ReportCard({
  title, description, icon: Icon, iconBg, iconColor,
  onExport, exporting, extraFilters,
}: ReportCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="flex-1">
        {extraFilters}
      </div>

      <Button onClick={onExport} disabled={exporting} className="w-full mt-5">
        {exporting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Generating…
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </>
        )}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ReportsPage() {
  const { api, orgSlug } = useTenant();
  const [fmt, setFmt] = useState<Format>('csv');
  const [eventId, setEventId] = useState<string>('all');
  const [regStatus, setRegStatus] = useState<RegistrationStatus>('all');
  const [exportingReg, setExportingReg] = useState(false);
  const [exportingAtt, setExportingAtt] = useState(false);

  const { data: eventsRes } = useQuery({
    queryKey: ['dashboard-events'],
    queryFn: () => api.dashboard.getEventOptions(),
    staleTime: 5 * 60_000,
  });

  const events = eventsRes?.data.data?.events ?? [];

  const buildParams = (extra?: Record<string, string>) => {
    const p = new URLSearchParams({ format: fmt });
    if (eventId !== 'all') p.set('eventId', eventId);
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  };

  const selectedEventName = events.find((e) => e._id === eventId)?.name ?? '';
  const ext = fmt === 'excel' ? 'xlsx' : fmt;

  const buildFilename = (type: 'registrations' | 'attendance') => {
    const slug = selectedEventName
      ? selectedEventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'all-events';
    return `${type}_${slug}.${ext}`;
  };

  const handleExportRegistrations = async () => {
    setExportingReg(true);
    try {
      const extra: Record<string, string> = {};
      if (regStatus !== 'all') extra.status = regStatus;
      await triggerDownload(`/api/${orgSlug}/admin/reports/registrations?${buildParams(extra)}`, buildFilename('registrations'));
      toast.success('Registrations report downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingReg(false);
    }
  };

  const handleExportAttendance = async () => {
    setExportingAtt(true);
    try {
      await triggerDownload(`/api/${orgSlug}/admin/reports/attendance?${buildParams()}`, buildFilename('attendance'));
      toast.success('Attendance report downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingAtt(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports"
        description="Export registration and attendance data in your preferred format"
      />

      {/* Global filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <p className="font-semibold text-slate-800 mb-1">Export Format</p>
          <p className="text-xs text-slate-400 mb-3">Choose the output format for all reports below</p>
          <FormatPicker value={fmt} onChange={setFmt} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Event</label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard
          title="Registrations Report"
          description="Full list of registrations with status, attendance, and submission details"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onExport={handleExportRegistrations}
          exporting={exportingReg}
          extraFilters={
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Status</label>
              <Select value={regStatus} onValueChange={(v) => setRegStatus(v as RegistrationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        <ReportCard
          title="Attendance Report"
          description="List of all check-ins with registration number, name, NIC, and check-in timestamp"
          icon={ClipboardCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onExport={handleExportAttendance}
          exporting={exportingAtt}
        />
      </div>

      {/* Format details */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Format notes</p>
        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
          <li>CSV — plain text, compatible with all spreadsheet software</li>
          <li>Excel — styled .xlsx with blue header row and alternating row shading</li>
          <li>PDF — landscape A4 layout; registrations report shows first 8 columns to fit the page</li>
        </ul>
      </div>
    </div>
  );
}
