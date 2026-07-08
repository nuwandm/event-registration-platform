import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Users, Clock, CheckCircle2, XCircle, TrendingUp,
  BarChart3, Activity, Filter,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';

import { dashboardApi } from '@/api/dashboardApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardStats } from '@/types';

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

function buildStatCards(s: DashboardStats): StatCardProps[] {
  return [
    {
      label: 'Total Events',
      value: s.totalEvents,
      icon: CalendarDays,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      sub: `${s.publishedEvents} published`,
    },
    {
      label: 'Total Registrations',
      value: s.totalRegistrations,
      icon: Users,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      sub: `${s.pendingRegistrations} pending review`,
    },
    {
      label: 'Approved',
      value: s.approvedRegistrations,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      sub: `${s.rejectedRegistrations} rejected`,
    },
    {
      label: "Today's Check-Ins",
      value: s.todayAttendance,
      icon: Activity,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      sub: `${s.attendancePercentage}% attendance rate`,
    },
    {
      label: 'Total Attended',
      value: s.totalAttended,
      icon: TrendingUp,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      sub: `out of ${s.approvedRegistrations} approved`,
    },
    {
      label: 'Rejected',
      value: s.rejectedRegistrations,
      icon: XCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'Pending Review',
      value: s.pendingRegistrations,
      icon: Clock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Attendance Rate',
      value: `${s.attendancePercentage}%`,
      icon: BarChart3,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      sub: `${s.totalAttended} of ${s.approvedRegistrations} attended`,
    },
  ];
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Empty chart state ─────────────────────────────────────────────────────────
function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
      <BarChart3 className="w-10 h-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Day range selector ────────────────────────────────────────────────────────
const DAY_OPTIONS = [7, 14, 30, 60, 90] as const;
type DayOption = typeof DAY_OPTIONS[number];

// ── Main page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [days, setDays] = useState<DayOption>(30);
  const [eventFilter, setEventFilter] = useState<string>('all');

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: chartRes, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart', days, eventFilter],
    queryFn: () => dashboardApi.getChartData(days, eventFilter),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: eventsRes } = useQuery({
    queryKey: ['dashboard-events'],
    queryFn: () => dashboardApi.getEventOptions(),
    staleTime: 5 * 60_000,
  });

  const stats = statsRes?.data.data?.stats;
  const allPoints = chartRes?.data.data?.points ?? [];
  const events = eventsRes?.data.data?.events ?? [];

  // Format dates for display
  const formattedPoints = allPoints.map((p) => ({
    ...p,
    label: format(new Date(p.date + 'T00:00:00'), days <= 14 ? 'MMM d' : 'MMM d'),
  }));

  // Trim x-axis labels when many points
  const tickInterval = days <= 14 ? 0 : days <= 30 ? 3 : days <= 60 ? 6 : 9;

  // Check if there's any real data
  const hasAnyData = formattedPoints.some((p) => p.registrations > 0 || p.attendance > 0);
  const hasRegData = formattedPoints.some((p) => p.registrations > 0);
  const hasAttData = formattedPoints.some((p) => p.attendance > 0);

  // For bar chart show only days with activity (or last N days if none)
  const barPoints = (() => {
    const active = formattedPoints.filter((p) => p.registrations > 0 || p.attendance > 0);
    if (active.length === 0) return formattedPoints.slice(-7);
    // Show window around active days
    const lastActive = formattedPoints.lastIndexOf(active[active.length - 1]);
    const start = Math.max(0, lastActive - 13);
    return formattedPoints.slice(start, lastActive + 1);
  })();

  const selectedEventName = events.find((e) => e._id === eventFilter)?.name;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of events, registrations, and attendance"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || !stats
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : buildStatCards(stats).map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Chart filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          Chart Filters
        </div>

        {/* Day range */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Event filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400 shrink-0">Filter by event</span>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-8 text-xs w-52">
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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Area / line chart — Registrations over time */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-semibold text-slate-800">Registrations Over Time</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily registration and attendance · last {days} days
                {selectedEventName && <span className="text-blue-500"> · {selectedEventName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
                <span className="text-slate-400">Registrations</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
                <span className="text-slate-400">Attendance</span>
              </span>
            </div>
          </div>

          {chartLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : !hasAnyData ? (
            <ChartEmpty message={`No activity in the last ${days} days`} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={formattedPoints} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} />
                {hasRegData && (
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    name="Registrations"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradReg)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                )}
                {hasAttData && (
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradAtt)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — Daily comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-semibold text-slate-800">Daily Comparison</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Registrations vs check-ins · recent activity
                {selectedEventName && <span className="text-blue-500"> · {selectedEventName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />
                <span className="text-slate-400">Registrations</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" />
                <span className="text-slate-400">Attendance</span>
              </span>
            </div>
          </div>

          {chartLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : !hasAnyData ? (
            <ChartEmpty message="No activity to compare yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barPoints}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                barCategoryGap="35%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="registrations"
                  name="Registrations"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="attendance"
                  name="Attendance"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
