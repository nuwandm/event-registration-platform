import { Request } from 'express';
import { IAdmin } from '../models/Admin';
import { ITenant } from '../models/Tenant';

export interface AuthRequest extends Request {
  admin?: IAdmin;
  tenant?: ITenant;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  eventId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
