// ── Auth ──────────────────────────────────────────────────────────────────────
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

// ── Event ─────────────────────────────────────────────────────────────────────
export type EventStatus = 'draft' | 'published' | 'closed';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export interface Event {
  _id: string;
  name: string;
  slug: string;
  description: string;
  venue: string;
  eventDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  maxParticipants?: number;
  registrationFee: number;
  bankDetails: BankDetails;
  bannerImage?: string;
  status: EventStatus;
  registrationCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Registration ──────────────────────────────────────────────────────────────
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'not_attended' | 'attended';

export interface Registration {
  _id: string;
  eventId: string | Event;
  registrationNumber: string;
  fullName: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  organization?: string;
  designation?: string;
  receiptUrl: string;
  status: RegistrationStatus;
  qrToken?: string;
  qrCodeUrl?: string;
  attendanceStatus: AttendanceStatus;
  attendanceTime?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceLog {
  _id: string;
  registrationId: string | Registration;
  eventId: string | Event;
  scannedBy: string | Admin;
  scannedAt: string;
  status: 'success' | 'duplicate' | 'invalid';
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  totalAttended: number;
  todayAttendance: number;
  attendancePercentage: number;
}
