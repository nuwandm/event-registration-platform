import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { tenantService } from '../services/tenantService';
import { Admin } from '../models/Admin';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const signupValidation = [
  body('orgName').trim().notEmpty().withMessage('Organization name is required').isLength({ max: 150 }),
  body('orgSlug')
    .trim()
    .notEmpty()
    .withMessage('Organization URL slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers and hyphens')
    .isLength({ min: 2, max: 50 }),
  body('contactEmail').isEmail().withMessage('Valid contact email is required').normalizeEmail(),
  body('adminName').trim().notEmpty().withMessage('Admin name is required').isLength({ max: 100 }),
  body('adminEmail').isEmail().withMessage('Valid admin email is required').normalizeEmail(),
  body('adminPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Invalid hex color'),
];

const extractErrors = (req: Request): Record<string, string> | null => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().reduce(
    (acc, err) => { if ('path' in err) acc[err.path] = err.msg; return acc; },
    {} as Record<string, string>
  );
};

export const tenantController = {
  // POST /api/tenants/signup — Public
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldErrors = extractErrors(req);
      if (fieldErrors) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors });
        return;
      }

      const { orgName, orgSlug, contactEmail, adminName, adminEmail, adminPassword, primaryColor } = req.body as {
        orgName: string; orgSlug: string; contactEmail: string;
        adminName: string; adminEmail: string; adminPassword: string; primaryColor?: string;
      };

      // Check if admin email already exists
      const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });
      if (existingAdmin) {
        res.status(409).json({ success: false, message: 'An account with this email already exists' });
        return;
      }

      // Create tenant (status: pending)
      const tenant = await tenantService.signup(
        { name: orgName, slug: orgSlug, contactEmail, adminName, adminPassword, primaryColor },
        req.file
      );

      // Create the org_admin account linked to tenant
      // NOTE: Admin pre-save hook hashes the password — pass plain text here
      await Admin.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'org_admin',
        tenantId: tenant._id,
      });

      res.status(201).json({
        success: true,
        message: 'Registration submitted. You will be notified once your account is approved.',
        data: { tenantId: String(tenant._id), slug: tenant.slug },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tenants/check-slug?slug=xxx — Public
  async checkSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.query as { slug: string };
      if (!slug) {
        res.status(400).json({ success: false, message: 'Slug is required' });
        return;
      }
      const available = await tenantService.isSlugAvailable(slug.toLowerCase());
      res.json({ success: true, data: { available } });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tenants/:orgSlug/public — Public (for branding on public pages)
  async getPublicInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getBySlug(req.params.orgSlug);
      if (tenant.status !== 'active') {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }
      res.json({
        success: true,
        data: {
          tenant: {
            name: tenant.name,
            slug: tenant.slug,
            logoUrl: tenant.logoUrl,
            primaryColor: tenant.primaryColor,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Super admin endpoints ──────────────────────────────────────────────────

  // GET /api/superadmin/tenants
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await tenantService.getAll({
        page, limit,
        status: status as 'pending' | 'active' | 'suspended' | undefined,
        search,
      });
      res.json({ success: true, message: 'Tenants retrieved', data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/superadmin/tenants/:id
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getById(req.params.id);
      res.json({ success: true, data: { tenant } });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/superadmin/tenants/:id/approve
  async approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.approve(req.params.id);
      res.json({ success: true, message: 'Tenant approved', data: { tenant } });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/superadmin/tenants/:id/reject
  async reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { note } = req.body as { note?: string };
      if (!note?.trim()) {
        res.status(400).json({ success: false, message: 'Rejection note is required' });
        return;
      }
      const tenant = await tenantService.reject(req.params.id, note.trim());
      res.json({ success: true, message: 'Tenant rejected', data: { tenant } });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/superadmin/tenants/:id/suspend
  async suspend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.suspend(req.params.id);
      res.json({ success: true, message: 'Tenant suspended', data: { tenant } });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/superadmin/stats
  async getPlatformStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantStats = await tenantService.getStats();
      res.json({
        success: true,
        data: {
          tenants: {
            pending: tenantStats.pending ?? 0,
            active: tenantStats.active ?? 0,
            suspended: tenantStats.suspended ?? 0,
            total: Object.values(tenantStats).reduce((a, b) => a + b, 0),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/superadmin/tenants/:id/branding — Super admin or org_admin
  async updateBranding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) throw new AppError('Unauthorized', 401);
      const { name, primaryColor } = req.body as { name?: string; primaryColor?: string };
      const tenant = await tenantService.updateBranding(req.params.id, { name, primaryColor }, req.file);
      res.json({ success: true, message: 'Branding updated', data: { tenant } });
    } catch (error) {
      next(error);
    }
  },
};
