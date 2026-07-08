import api from './axiosInstance';
import type { ApiResponse, Tenant, PublicTenantInfo, PaginatedResponse, PlatformStats } from '@/types';

export interface SignupPayload {
  orgName: string;
  orgSlug: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  primaryColor?: string;
  logo?: File;
}

export const tenantApi = {
  // Public
  signup: (payload: SignupPayload) => {
    const form = new FormData();
    form.append('orgName', payload.orgName);
    form.append('orgSlug', payload.orgSlug);
    form.append('contactEmail', payload.contactEmail);
    form.append('adminName', payload.adminName);
    form.append('adminEmail', payload.adminEmail);
    form.append('adminPassword', payload.adminPassword);
    if (payload.primaryColor) form.append('primaryColor', payload.primaryColor);
    if (payload.logo) form.append('banner', payload.logo);
    return api.post<ApiResponse<{ tenantId: string; slug: string }>>('/signup', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  checkSlug: (slug: string) =>
    api.get<ApiResponse<{ available: boolean }>>('/check-slug', { params: { slug } }),

  getPublicInfo: (orgSlug: string) =>
    api.get<ApiResponse<{ tenant: PublicTenantInfo }>>(`/${orgSlug}/public`),

  // Org admin — update own tenant branding
  updateOwnBranding: (payload: { name?: string; primaryColor?: string; logo?: File }) => {
    const form = new FormData();
    if (payload.name) form.append('name', payload.name);
    if (payload.primaryColor) form.append('primaryColor', payload.primaryColor);
    if (payload.logo) form.append('banner', payload.logo);
    return api.patch<ApiResponse<{ tenant: Tenant }>>('/me/branding', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Super admin
  superAdmin: {
    getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      api.get<ApiResponse<PaginatedResponse<Tenant>>>('/superadmin/tenants', { params }),

    getById: (id: string) =>
      api.get<ApiResponse<{ tenant: Tenant }>>(`/superadmin/tenants/${id}`),

    approve: (id: string) =>
      api.post<ApiResponse<{ tenant: Tenant }>>(`/superadmin/tenants/${id}/approve`),

    reject: (id: string, note: string) =>
      api.post<ApiResponse<{ tenant: Tenant }>>(`/superadmin/tenants/${id}/reject`, { note }),

    suspend: (id: string) =>
      api.post<ApiResponse<{ tenant: Tenant }>>(`/superadmin/tenants/${id}/suspend`),

    getStats: () =>
      api.get<ApiResponse<PlatformStats>>('/superadmin/stats'),

    updateBranding: (id: string, payload: { name?: string; primaryColor?: string; logo?: File }) => {
      const form = new FormData();
      if (payload.name) form.append('name', payload.name);
      if (payload.primaryColor) form.append('primaryColor', payload.primaryColor);
      if (payload.logo) form.append('banner', payload.logo);
      return api.patch<ApiResponse<{ tenant: Tenant }>>(`/superadmin/tenants/${id}/branding`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
};
