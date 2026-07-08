import api from './axiosInstance';
import type { ApiResponse, Registration, PaginatedResponse } from '@/types';

export interface SubmitRegistrationPayload {
  fullName: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  organization?: string;
  designation?: string;
  receipt: File;
}

export interface RegistrationFilters {
  page?: number;
  limit?: number;
  status?: string;
  eventId?: string;
  search?: string;
}

export interface SubmitRegistrationResult {
  registrationId: string;
  registrationNumber: string;
  status: string;
}

export const registrationsApi = {
  // Public
  submit: (eventId: string, payload: SubmitRegistrationPayload) => {
    const form = new FormData();
    form.append('fullName', payload.fullName);
    form.append('nic', payload.nic);
    form.append('email', payload.email);
    form.append('mobile', payload.mobile);
    form.append('address', payload.address);
    if (payload.organization) form.append('organization', payload.organization);
    if (payload.designation) form.append('designation', payload.designation);
    form.append('receipt', payload.receipt);

    return api.post<ApiResponse<SubmitRegistrationResult>>(
      `/registrations/${eventId}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  getStatus: (id: string) =>
    api.get<ApiResponse<{ registration: Registration }>>(`/registrations/status/${id}`),

  checkByNumber: (registrationNumber: string) =>
    api.get<ApiResponse<{ registration: Registration }>>(`/registrations/check/${registrationNumber}`),

  // Admin
  getAll: (filters: RegistrationFilters = {}) =>
    api.get<ApiResponse<PaginatedResponse<Registration>>>('/admin/registrations', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<{ registration: Registration }>>(`/admin/registrations/${id}`),

  approve: (id: string, remarks?: string) =>
    api.put<ApiResponse<{ registration: Registration }>>(`/admin/registrations/${id}/approve`, { remarks }),

  reject: (id: string, remarks: string) =>
    api.put<ApiResponse<{ registration: Registration }>>(`/admin/registrations/${id}/reject`, { remarks }),

  update: (id: string, payload: { status?: string; attendanceStatus?: string; adminRemarks?: string }) =>
    api.patch<ApiResponse<{ registration: Registration }>>(`/admin/registrations/${id}`, payload),

  remove: (id: string, reason: string) =>
    api.delete<ApiResponse>(`/admin/registrations/${id}`, { data: { reason } }),
};
