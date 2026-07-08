import { Router } from 'express';
import authRoutes from './authRoutes';
import eventRoutes from './eventRoutes';
import registrationRoutes from './registrationRoutes';
import attendanceRoutes from './attendanceRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', eventRoutes);
router.use('/', registrationRoutes);
router.use('/', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
