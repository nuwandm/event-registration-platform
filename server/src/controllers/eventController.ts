import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { eventService } from '../services/eventService';
import { AuthRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

const parseBankDetails = (req: Request, _res: Response, next: NextFunction): void => {
  if (typeof req.body.bankDetails === 'string') {
    try { req.body.bankDetails = JSON.parse(req.body.bankDetails); } catch { /* leave as-is */ }
  }
  next();
};

export const createEventValidation = [
  parseBankDetails,
  body('name').trim().notEmpty().withMessage('Event name is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('registrationOpenDate').isISO8601().withMessage('Valid registration open date is required'),
  body('registrationCloseDate').isISO8601().withMessage('Valid registration close date is required'),
  body('registrationFee').isFloat({ min: 0 }).withMessage('Valid registration fee is required'),
  body('bankDetails.bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('bankDetails.accountName').trim().notEmpty().withMessage('Account name is required'),
  body('bankDetails.accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('bankDetails.branch').trim().notEmpty().withMessage('Branch is required'),
  body('status').optional().isIn(['draft', 'published', 'closed']),
  body('maxParticipants').optional().isInt({ min: 1 }),
];

const extractValidationErrors = (req: Request): Record<string, string> | null => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().reduce(
    (acc, err) => {
      if ('path' in err) acc[err.path] = err.msg;
      return acc;
    },
    {} as Record<string, string>
  );
};

const requireTenant = (req: AuthRequest): string => {
  if (!req.tenant) throw new AppError('Tenant context missing', 500);
  return String(req.tenant._id);
};

export const eventController = {
  // Public
  async getPublishedEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const events = await eventService.getPublishedEvents(tenantId);
      res.json({ success: true, message: 'Events retrieved', data: { events } });
    } catch (error) {
      next(error);
    }
  },

  async getPublicEventBySlug(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const event = await eventService.getPublicEventBySlug(req.params.slug, tenantId);
      res.json({ success: true, message: 'Event retrieved', data: { event } });
    } catch (error) {
      next(error);
    }
  },

  // Admin
  async getAllEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await eventService.getAllEventsPaginated({
        page, limit, tenantId,
        status: status as 'draft' | 'published' | 'closed' | undefined,
        search,
      });
      res.json({ success: true, message: 'Events retrieved', data: result });
    } catch (error) {
      next(error);
    }
  },

  async getEventById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const event = await eventService.getEventById(req.params.id, tenantId);
      res.json({ success: true, message: 'Event retrieved', data: { event } });
    } catch (error) {
      next(error);
    }
  },

  async createEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldErrors = extractValidationErrors(req);
      if (fieldErrors) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors } as ApiResponse);
        return;
      }
      if (!req.admin) throw new AppError('Unauthorized', 401);
      const tenantId = requireTenant(req);

      if (typeof req.body.bankDetails === 'string') {
        req.body.bankDetails = JSON.parse(req.body.bankDetails);
      }
      if (typeof req.body.bannerPosition === 'string') {
        try { req.body.bannerPosition = JSON.parse(req.body.bannerPosition); } catch { delete req.body.bannerPosition; }
      }
      if (typeof req.body.questions === 'string') {
        try { req.body.questions = JSON.parse(req.body.questions); } catch { req.body.questions = []; }
      }

      const event = await eventService.createEvent(req.body, tenantId, String(req.admin._id), req.file);
      res.status(201).json({ success: true, message: 'Event created', data: { event } });
    } catch (error) {
      next(error);
    }
  },

  async updateEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      if (typeof req.body.bankDetails === 'string') {
        req.body.bankDetails = JSON.parse(req.body.bankDetails);
      }
      if (typeof req.body.bannerPosition === 'string') {
        try { req.body.bannerPosition = JSON.parse(req.body.bannerPosition); } catch { delete req.body.bannerPosition; }
      }
      if (typeof req.body.questions === 'string') {
        try { req.body.questions = JSON.parse(req.body.questions); } catch { req.body.questions = []; }
      }
      const event = await eventService.updateEvent(req.params.id, tenantId, req.body, req.file);
      res.json({ success: true, message: 'Event updated', data: { event } });
    } catch (error) {
      next(error);
    }
  },

  async deleteEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      await eventService.deleteEvent(req.params.id, tenantId);
      res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  },

  async toggleAdmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const event = await eventService.toggleAdmission(req.params.id, tenantId);
      res.json({
        success: true,
        message: event.admissionOpen ? 'Admission opened' : 'Admission closed',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  },
};
