import { Router } from 'express';
import {
  registrationController,
  submitRegistrationValidation,
} from '../controllers/registrationController';
import { authGuard } from '../middleware/authGuard';
import { uploadReceipt } from '../middleware/upload';
import { registrationLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post(
  '/registrations/:eventId',
  registrationLimiter,
  uploadReceipt,
  submitRegistrationValidation,
  registrationController.submitRegistration
);

router.get('/registrations/status/:id', registrationController.getRegistrationStatus);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/registrations', authGuard, registrationController.getAllRegistrations);
router.get('/admin/registrations/:id', authGuard, registrationController.getRegistrationById);
router.put('/admin/registrations/:id/approve', authGuard, registrationController.approveRegistration);
router.put('/admin/registrations/:id/reject', authGuard, registrationController.rejectRegistration);

export default router;
