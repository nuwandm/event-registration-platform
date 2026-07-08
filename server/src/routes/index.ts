import { Router } from 'express';
import { authGuard } from '../middleware/authGuard';
import { tenantGuard, publicTenantGuard } from '../middleware/tenantGuard';
import { superAdminGuard } from '../middleware/superAdminGuard';

import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import eventRoutes from './eventRoutes';
import registrationRoutes from './registrationRoutes';
import adminEventRoutes from './adminEventRoutes';
import adminRegistrationRoutes from './adminRegistrationRoutes';
import attendanceRoutes from './attendanceRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';
import userRoutes from './userRoutes';
import ogRoutes from './ogRoutes';

const router = Router();

// ── Auth ───────────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Tenant signup + super admin management ─────────────────────────────────────
router.use('/', tenantRoutes);

// ── OG meta tags ───────────────────────────────────────────────────────────────
router.use('/og', ogRoutes);

// ── Public tenant-scoped routes ────────────────────────────────────────────────
// GET  /:orgSlug/events
// GET  /:orgSlug/events/:slug
router.use('/:orgSlug/events', publicTenantGuard, eventRoutes);

// POST /:orgSlug/registrations/:eventId
// GET  /:orgSlug/registrations/status/:id
// GET  /:orgSlug/registrations/check/:registrationNumber
router.use('/:orgSlug/registrations', publicTenantGuard, registrationRoutes);

// ── Admin tenant-scoped routes (auth + tenant required) ────────────────────────
const adminAuth = [authGuard, tenantGuard];

router.use('/:orgSlug/admin/events', ...adminAuth, adminEventRoutes);
router.use('/:orgSlug/admin/registrations', ...adminAuth, adminRegistrationRoutes);
router.use('/:orgSlug/admin/attendance', ...adminAuth, attendanceRoutes);
router.use('/:orgSlug/admin/dashboard', ...adminAuth, dashboardRoutes);
router.use('/:orgSlug/admin/reports', ...adminAuth, reportRoutes);

// Users: org_admin only (not staff)
router.use('/:orgSlug/admin/users', ...adminAuth, userRoutes);

// ── Super admin routes (no org scope) ─────────────────────────────────────────
// Already handled in tenantRoutes at /superadmin/*

export default router;
