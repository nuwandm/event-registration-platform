import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/registrations', reportController.exportRegistrations);
router.get('/attendance', reportController.exportAttendance);

export default router;
