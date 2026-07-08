import { Router } from 'express';
import { eventController, createEventValidation } from '../controllers/eventController';
import { uploadBanner } from '../middleware/upload';

// mergeParams allows access to :orgSlug from parent router
const router = Router({ mergeParams: true });

// ── Public (mounted at /:orgSlug/events) ──────────────────────────────────────
router.get('/', eventController.getPublishedEvents);
router.get('/:slug', eventController.getPublicEventBySlug);

export default router;
