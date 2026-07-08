import api from './axiosInstance';
import type { ApiResponse } from '@/types';

export type ScanOutcome = 'success' | 'duplicate' | 'invalid';

export interface ScanRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  nic: string;
  email: string;
  organization?: string;
  attendanceTime?: string;
  attendanceStatus: string;
}

export interface ScanEvent {
  id: string;
  name: string;
  venue?: string;
  eventDate?: string;
}

export interface ScanResult {
  outcome: ScanOutcome;
  message: string;
  registration?: ScanRegistration;
  event?: ScanEvent;
}

export const attendanceApi = (orgSlug: string) => ({
  scan: (qrData: string, eventId?: string) =>
    api.post<ApiResponse<ScanResult>>(`/${orgSlug}/admin/attendance/scan`, { qrData, eventId }),

  getList: (eventId: string) =>
    api.get<ApiResponse<{ logs: unknown[] }>>(`/${orgSlug}/admin/attendance/${eventId}`),
});
