import { Router } from 'express';
import { body } from 'express-validator';
import { authController, loginValidation } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/platform-login', authLimiter, loginValidation, authController.platformLogin);
router.get('/me', authGuard, authController.getMe);
router.post(
  '/change-password',
  authGuard,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  authController.changePassword
);

export default router;
