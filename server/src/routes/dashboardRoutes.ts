import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router({ mergeParams: true });

router.get('/stats', dashboardController.getStats);
router.get('/chart', dashboardController.getChartData);
router.get('/events', dashboardController.getEventOptions);

export default router;
