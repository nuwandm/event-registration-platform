import { Router } from 'express';
import { eventController, createEventValidation } from '../controllers/eventController';
import { uploadBanner } from '../middleware/upload';

const router = Router({ mergeParams: true });

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', uploadBanner, createEventValidation, eventController.createEvent);
router.put('/:id', uploadBanner, eventController.updateEvent);
router.patch('/:id/admission', eventController.toggleAdmission);
router.delete('/:id', eventController.deleteEvent);

export default router;
