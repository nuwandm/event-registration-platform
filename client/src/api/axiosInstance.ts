import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { orgSlug } = useAuthStore.getState();
      useAuthStore.getState().logout();
      // Redirect to org login or super admin login
      window.location.href = orgSlug ? `/${orgSlug}/admin/login` : '/superadmin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

/** Returns the tenant-scoped API base path, e.g. /api/dreamlabs */
export const tenantBase = (orgSlug: string) => `${BASE}/${orgSlug}`;
