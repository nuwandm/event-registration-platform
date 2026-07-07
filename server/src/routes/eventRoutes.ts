import { Router } from 'express';
import { eventController, createEventValidation } from '../controllers/eventController';
import { authGuard } from '../middleware/authGuard';
import { uploadBanner } from '../middleware/upload';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/events', eventController.getPublishedEvents);
router.get('/events/:slug', eventController.getPublicEventBySlug);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/events', authGuard, eventController.getAllEvents);
router.get('/admin/events/:id', authGuard, eventController.getEventById);
router.post('/admin/events', authGuard, uploadBanner, createEventValidation, eventController.createEvent);
router.put('/admin/events/:id', authGuard, uploadBanner, eventController.updateEvent);
router.delete('/admin/events/:id', authGuard, eventController.deleteEvent);

export default router;
