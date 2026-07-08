import { Router } from 'express';
import { tenantController, signupValidation } from '../controllers/tenantController';
import { authGuard } from '../middleware/authGuard';
import { superAdminGuard } from '../middleware/superAdminGuard';
import { uploadBanner } from '../middleware/upload';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/signup', uploadBanner, signupValidation, tenantController.signup);
router.get('/check-slug', tenantController.checkSlug);
router.get('/:orgSlug/public', tenantController.getPublicInfo);

// ── Super admin ───────────────────────────────────────────────────────────────
router.get('/superadmin/tenants', authGuard, superAdminGuard, tenantController.getAll);
router.get('/superadmin/tenants/:id', authGuard, superAdminGuard, tenantController.getById);
router.post('/superadmin/tenants/:id/approve', authGuard, superAdminGuard, tenantController.approve);
router.post('/superadmin/tenants/:id/reject', authGuard, superAdminGuard, tenantController.reject);
router.post('/superadmin/tenants/:id/suspend', authGuard, superAdminGuard, tenantController.suspend);
router.get('/superadmin/stats', authGuard, superAdminGuard, tenantController.getPlatformStats);
router.patch('/superadmin/tenants/:id/branding', authGuard, superAdminGuard, uploadBanner, tenantController.updateBranding);

// ── Org admin — update own tenant branding ───────────────────────────────────
router.patch('/me/branding', authGuard, uploadBanner, tenantController.updateOwnBranding);

export default router;
