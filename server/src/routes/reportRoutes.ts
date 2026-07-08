import { Router } from 'express';
import { reportController } from '../controllers/reportController';

const router = Router({ mergeParams: true });

router.get('/registrations', reportController.exportRegistrations);
router.get('/attendance', reportController.exportAttendance);

export default router;
