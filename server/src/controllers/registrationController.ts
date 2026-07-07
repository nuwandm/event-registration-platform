import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { registrationService } from '../services/registrationService';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const submitRegistrationValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 200 }),
  body('nic').trim().notEmpty().withMessage('NIC / Passport number is required'),
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('organization').optional().trim(),
  body('designation').optional().trim(),
];

const extractErrors = (req: Request): Record<string, string> | null => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().reduce(
    (acc, err) => { if ('path' in err) acc[err.path] = err.msg; return acc; },
    {} as Record<string, string>
  );
};

export const registrationController = {
  // POST /api/registrations/:eventId — Public
  async submitRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldErrors = extractErrors(req);
      if (fieldErrors) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'Payment receipt is required', errors: { receipt: 'Please upload your bank transfer receipt' } });
        return;
      }

      const registration = await registrationService.submitRegistration(
        req.params.eventId,
        req.body,
        req.file
      );

      res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        data: {
          registrationId: String(registration._id),
          registrationNumber: registration.registrationNumber,
          status: registration.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/registrations/status/:id — Public
  async getRegistrationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registration = await registrationService.getRegistrationStatus(req.params.id);
      res.json({ success: true, message: 'Registration retrieved', data: { registration } });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/registrations — Admin
  async getAllRegistrations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const status = req.query.status as string | undefined;
      const eventId = req.query.eventId as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await registrationService.getAllRegistrations({
        page,
        limit,
        status: status as RegistrationQuery['status'],
        eventId,
        search,
      });

      res.json({ success: true, message: 'Registrations retrieved', data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/registrations/:id — Admin
  async getRegistrationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const registration = await registrationService.getRegistrationById(req.params.id);
      res.json({ success: true, message: 'Registration retrieved', data: { registration } });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/registrations/:id/approve — Admin
  async approveRegistration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { remarks } = req.body as { remarks?: string };
      const registration = await registrationService.approveRegistration(req.params.id, remarks);
      res.json({ success: true, message: 'Registration approved and QR code generated', data: { registration } });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/registrations/:id/reject — Admin
  async rejectRegistration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { remarks } = req.body as { remarks: string };
      if (!remarks || !remarks.trim()) {
        res.status(400).json({ success: false, message: 'Rejection reason is required' });
        return;
      }
      const registration = await registrationService.rejectRegistration(req.params.id, remarks.trim());
      res.json({ success: true, message: 'Registration rejected', data: { registration } });
    } catch (error) {
      next(error);
    }
  },
};

// Needed for type reference
import type { RegistrationQuery } from '../repositories/registrationRepository';
