// ── Auth ──────────────────────────────────────────────────────────────────────
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'org_admin' | 'super_admin' | 'staff';
  tenantId?: string;
  assignedEvents: string[];
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: 'staff';
  assignedEvents: { _id: string; name: string; slug: string; eventDate: string }[];
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  orgSlug?: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

// ── Tenant ────────────────────────────────────────────────────────────────────
export type TenantStatus = 'pending' | 'active' | 'suspended';

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  contactEmail: string;
  logoUrl?: string;
  primaryColor: string;
  status: TenantStatus;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTenantInfo {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
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
  tenantId: string;
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
  bannerPosition?: { x: number; y: number };
  admissionOpen: boolean;
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
  tenantId: string;
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

// ── Platform stats (super admin) ──────────────────────────────────────────────
export interface PlatformStats {
  tenants: {
    pending: number;
    active: number;
    suspended: number;
    total: number;
  };
}
