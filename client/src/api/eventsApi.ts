import api from './axiosInstance';
import type { ApiResponse, Event, PaginatedResponse } from '@/types';

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const buildFormData = (data: Record<string, unknown>, file?: File): FormData => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object' && !(value instanceof File)) {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  });
  if (file) form.append('banner', file);
  return form;
};

export const eventsApi = {
  // Public
  getPublished: () => api.get<ApiResponse<{ events: Event[] }>>('/events'),
  getBySlug: (slug: string) => api.get<ApiResponse<{ event: Event }>>(`/events/${slug}`),

  // Admin
  getAll: (filters: EventFilters = {}) =>
    api.get<ApiResponse<PaginatedResponse<Event>>>('/admin/events', { params: filters }),

  getById: (id: string) => api.get<ApiResponse<{ event: Event }>>(`/admin/events/${id}`),

  create: (data: Record<string, unknown>, bannerFile?: File) =>
    api.post<ApiResponse<{ event: Event }>>('/admin/events', buildFormData(data, bannerFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Record<string, unknown>, bannerFile?: File) =>
    api.put<ApiResponse<{ event: Event }>>(`/admin/events/${id}`, buildFormData(data, bannerFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) => api.delete<ApiResponse>(`/admin/events/${id}`),

  toggleAdmission: (id: string) =>
    api.patch<ApiResponse<{ event: Event }>>(`/admin/events/${id}/admission`),
};
