import { Router } from 'express';
import { authGuard } from '../middleware/authGuard';
import { superAdminGuard } from '../middleware/superAdminGuard';
import {
  userController,
  createUserValidation,
  updateUserValidation,
} from '../controllers/userController';

const router = Router();

router.use(authGuard, superAdminGuard);

router.get('/', userController.list);
router.post('/', createUserValidation, userController.create);
router.put('/:id', updateUserValidation, userController.update);
router.delete('/:id', userController.remove);

// Event-staff assignment (from Events page)
router.get('/event/:eventId/staff', userController.getEventStaff);
router.put('/event/:eventId/staff', userController.setEventStaff);

export default router;
