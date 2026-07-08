import { Router } from 'express';
import { registrationController } from '../controllers/registrationController';

const router = Router({ mergeParams: true });

router.get('/', registrationController.getAllRegistrations);
router.get('/:id', registrationController.getRegistrationById);
router.put('/:id/approve', registrationController.approveRegistration);
router.put('/:id/reject', registrationController.rejectRegistration);
router.patch('/:id', registrationController.updateRegistration);
router.delete('/:id', registrationController.deleteRegistration);

export default router;
