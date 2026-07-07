import api from './axiosInstance';
import type { ApiResponse, AuthResponse, LoginCredentials } from '@/types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),

  getMe: () =>
    api.get<ApiResponse<{ admin: AuthResponse['admin'] }>>('/auth/me'),
};
