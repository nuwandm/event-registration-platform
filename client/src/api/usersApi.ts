import api from './axiosInstance';
import type { ApiResponse, StaffUser } from '@/types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  assignedEvents: string[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  assignedEvents?: string[];
}

export const usersApi = (orgSlug: string) => ({
  list: () =>
    api.get<ApiResponse<{ users: StaffUser[] }>>(`/${orgSlug}/admin/users`),
  create: (data: CreateUserPayload) =>
    api.post<ApiResponse<{ user: StaffUser }>>(`/${orgSlug}/admin/users`, data),
  update: (id: string, data: UpdateUserPayload) =>
    api.put<ApiResponse<{ user: StaffUser }>>(`/${orgSlug}/admin/users/${id}`, data),
  remove: (id: string) =>
    api.delete<ApiResponse>(`/${orgSlug}/admin/users/${id}`),

  getEventStaff: (eventId: string) =>
    api.get<ApiResponse<{ staff: StaffUser[] }>>(`/${orgSlug}/admin/users/event/${eventId}/staff`),
  setEventStaff: (eventId: string, staffIds: string[]) =>
    api.put<ApiResponse>(`/${orgSlug}/admin/users/event/${eventId}/staff`, { staffIds }),
});
