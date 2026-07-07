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

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/stats'),
  getChartData: (days = 30) => api.get<ApiResponse<{ points: ChartPoint[] }>>('/dashboard/chart', { params: { days } }),
  getEventOptions: () => api.get<ApiResponse<{ events: EventOption[] }>>('/dashboard/events'),
};
