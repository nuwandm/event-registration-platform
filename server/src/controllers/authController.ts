import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';
import { AuthRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const fieldErrors = errors.array().reduce(
          (acc, err) => {
            if ('path' in err) acc[err.path] = err.msg;
            return acc;
          },
          {} as Record<string, string>
        );
        res.status(400).json({ success: false, message: 'Validation failed', errors: fieldErrors });
        return;
      }

      const { email, password, orgSlug } = req.body as { email: string; password: string; orgSlug?: string };
      const result = await authService.login({ email, password, orgSlug });

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) throw new AppError('Unauthorized', 401);
      const admin = await authService.getMe(String(req.admin._id));

      res.status(200).json({
        success: true,
        message: 'Admin retrieved',
        data: { admin },
      });
    } catch (error) {
      next(error);
    }
  },
};
