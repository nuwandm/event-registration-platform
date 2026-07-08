import { Router } from 'express';
import { attendanceController, scanValidation } from '../controllers/attendanceController';

const router = Router({ mergeParams: true });

router.post('/scan', scanValidation, attendanceController.scan);
router.get('/:eventId', attendanceController.getAttendanceList);

export default router;
