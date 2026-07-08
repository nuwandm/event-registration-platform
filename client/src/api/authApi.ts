import api from './axiosInstance';
import type { ApiResponse, AuthResponse, LoginCredentials } from '@/types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),

  platformLogin: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse & { orgSlug: string }>>('/auth/platform-login', credentials),

  getMe: () =>
    api.get<ApiResponse<{ admin: AuthResponse['admin'] }>>('/auth/me'),

  changePassword: (dto: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<null>>('/auth/change-password', dto),
};
