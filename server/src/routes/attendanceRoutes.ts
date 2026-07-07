import { Router } from 'express';
import { attendanceController, scanValidation } from '../controllers/attendanceController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.post('/admin/attendance/scan', authGuard, scanValidation, attendanceController.scan);
router.get('/admin/attendance/:eventId', authGuard, attendanceController.getAttendanceList);

export default router;
