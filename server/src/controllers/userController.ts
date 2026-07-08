import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { userService } from '../services/userService';
import { AuthRequest, ApiResponse } from '../types';

export const createUserValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('assignedEvents').isArray().withMessage('assignedEvents must be an array'),
];

export const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('assignedEvents').optional().isArray().withMessage('assignedEvents must be an array'),
];

const getValidationErrors = (req: AuthRequest) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().reduce(
      (acc, err) => {
        if ('path' in err) acc[err.path] = err.msg;
        return acc;
      },
      {} as Record<string, string>
    );
  }
  return null;
};

export const userController = {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.listUsers();
      const response: ApiResponse = { success: true, message: 'Users retrieved', data: { users } };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldErrors = getValidationErrors(req);
      if (fieldErrors) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors });
        return;
      }
      const user = await userService.createUser(req.body);
      const response: ApiResponse = { success: true, message: 'User created', data: { user } };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldErrors = getValidationErrors(req);
      if (fieldErrors) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors });
        return;
      }
      const user = await userService.updateUser(req.params.id, req.body);
      const response: ApiResponse = { success: true, message: 'User updated', data: { user } };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id);
      const response: ApiResponse = { success: true, message: 'User deleted' };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },

  async getEventStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await userService.getStaffForEvent(req.params.eventId);
      res.status(200).json({ success: true, message: 'Staff retrieved', data: { staff } });
    } catch (err) {
      next(err);
    }
  },

  async setEventStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { staffIds } = req.body as { staffIds: string[] };
      if (!Array.isArray(staffIds)) {
        res.status(400).json({ success: false, message: 'staffIds must be an array' });
        return;
      }
      await userService.setEventStaff(req.params.eventId, staffIds);
      res.status(200).json({ success: true, message: 'Event staff updated' });
    } catch (err) {
      next(err);
    }
  },
};
