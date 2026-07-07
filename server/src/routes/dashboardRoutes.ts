import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/stats', dashboardController.getStats);
router.get('/chart', dashboardController.getChartData);
router.get('/events', dashboardController.getEventOptions);

export default router;
