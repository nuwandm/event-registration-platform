import { Router } from 'express';
import { authController, loginValidation } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginValidation, authController.login);
router.get('/me', authGuard, authController.getMe);

export default router;
