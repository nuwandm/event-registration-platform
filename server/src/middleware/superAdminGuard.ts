import { Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

export const superAdminGuard = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return next(new AppError('Access denied. Super admin only.', 403));
  }
  next();
};
