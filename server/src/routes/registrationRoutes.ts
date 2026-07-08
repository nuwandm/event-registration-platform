import { Router } from 'express';
import {
  registrationController,
  submitRegistrationValidation,
} from '../controllers/registrationController';
import { uploadReceipt } from '../middleware/upload';
import { registrationLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

// ── Public (mounted at /:orgSlug/registrations) ───────────────────────────────
router.post(
  '/:eventId',
  registrationLimiter,
  uploadReceipt,
  submitRegistrationValidation,
  registrationController.submitRegistration
);
router.get('/status/:id', registrationController.getRegistrationStatus);
router.get('/check/:registrationNumber', registrationController.checkByRegistrationNumber);

export default router;
