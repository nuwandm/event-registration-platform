import api from './axiosInstance';
import type { ApiResponse, DashboardStats } from '@/types';

export interface ChartPoint {
  date: string;
  registrations: number;
  attendance: number;
}

export interface EventOption {
  _id: string;
  name: string;
  slug: string;
  status: string;
}

export const dashboardApi = (orgSlug: string) => ({
  getStats: () =>
    api.get<ApiResponse<{ stats: DashboardStats }>>(`/${orgSlug}/admin/dashboard/stats`),
  getChartData: (days = 30, eventId?: string) =>
    api.get<ApiResponse<{ points: ChartPoint[] }>>(`/${orgSlug}/admin/dashboard/chart`, {
      params: { days, ...(eventId && eventId !== 'all' ? { eventId } : {}) },
    }),
  getEventOptions: () =>
    api.get<ApiResponse<{ events: EventOption[] }>>(`/${orgSlug}/admin/dashboard/events`),
});
