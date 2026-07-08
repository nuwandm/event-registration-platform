import { Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

/**
 * Resolves the tenant from the :orgSlug URL param and attaches it to req.tenant.
 * Must be used AFTER authGuard on routes that need both auth + tenant context.
 * Also validates that the authenticated admin belongs to that tenant.
 */
export const tenantGuard = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.orgSlug;
    if (!slug) return next(new AppError('Organization slug is required', 400));

    const tenant = await Tenant.findOne({ slug });
    if (!tenant) return next(new AppError('Organization not found', 404));
    if (tenant.status !== 'active') return next(new AppError('This organization is not active', 403));

    // Super admin can access any tenant
    if (req.admin?.role === 'super_admin') {
      req.tenant = tenant;
      return next();
    }

    // org_admin / staff must belong to this tenant
    if (!req.admin?.tenantId || String(req.admin.tenantId) !== String(tenant._id)) {
      return next(new AppError('Access denied to this organization', 403));
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves the tenant from :orgSlug for PUBLIC routes (no auth required).
 * Only checks that tenant is active.
 */
export const publicTenantGuard = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.orgSlug;
    if (!slug) return next(new AppError('Organization slug is required', 400));

    const tenant = await Tenant.findOne({ slug });
    if (!tenant || tenant.status !== 'active') {
      return next(new AppError('Organization not found', 404));
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};
