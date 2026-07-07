import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Users, Clock, CheckCircle2, XCircle, TrendingUp,
  BarChart3, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format } from 'date-fns';

import { dashboardApi } from '@/api/dashboardApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
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

// ── Stats grid ────────────────────────────────────────────────────────────────
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
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Day range selector ────────────────────────────────────────────────────────
const DAY_OPTIONS = [7, 14, 30, 60, 90] as const;
type DayOption = typeof DAY_OPTIONS[number];

// ── Main page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [days, setDays] = useState<DayOption>(30);

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 60_000,
  });

  const { data: chartRes, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart', days],
    queryFn: () => dashboardApi.getChartData(days),
    staleTime: 60_000,
  });

  const stats = statsRes?.data.data?.stats;
  const chartPoints = chartRes?.data.data?.points ?? [];

  const formattedPoints = chartPoints.map((p) => ({
    ...p,
    label: format(new Date(p.date + 'T00:00:00'), 'MMM d'),
  }));

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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Registrations over time */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-800">Registrations Over Time</p>
              <p className="text-xs text-slate-400">Daily registration and attendance counts</p>
            </div>
            <div className="flex gap-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    days === d
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={formattedPoints} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(formattedPoints.length / 6)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="mb-4">
            <p className="font-semibold text-slate-800">Daily Comparison</p>
            <p className="text-xs text-slate-400">Registrations vs check-ins side by side</p>
          </div>

          {chartLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={formattedPoints.slice(-14)}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="registrations" name="Registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
