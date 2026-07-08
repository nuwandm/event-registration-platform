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

export const usersApi = {
  list: () => api.get<ApiResponse<{ users: StaffUser[] }>>('/users'),
  create: (data: CreateUserPayload) => api.post<ApiResponse<{ user: StaffUser }>>('/users', data),
  update: (id: string, data: UpdateUserPayload) =>
    api.put<ApiResponse<{ user: StaffUser }>>(`/users/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse>(`/users/${id}`),

  getEventStaff: (eventId: string) =>
    api.get<ApiResponse<{ staff: StaffUser[] }>>(`/users/event/${eventId}/staff`),
  setEventStaff: (eventId: string, staffIds: string[]) =>
    api.put<ApiResponse>(`/users/event/${eventId}/staff`, { staffIds }),
};
