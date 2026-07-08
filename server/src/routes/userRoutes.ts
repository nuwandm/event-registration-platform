import { Router } from 'express';
import {
  userController,
  createUserValidation,
  updateUserValidation,
} from '../controllers/userController';

const router = Router({ mergeParams: true });

router.get('/', userController.list);
router.post('/', createUserValidation, userController.create);
router.put('/:id', updateUserValidation, userController.update);
router.delete('/:id', userController.remove);

router.get('/event/:eventId/staff', userController.getEventStaff);
router.put('/event/:eventId/staff', userController.setEventStaff);

export default router;
