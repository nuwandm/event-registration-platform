import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { AuthRequest } from '../types';

import { AppError } from '../middleware/errorHandler';

const requireTenant = (req: AuthRequest): string => {
  if (!req.tenant) throw new AppError('Tenant context missing', 500);
  return String(req.tenant._id);
};

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const stats = await dashboardService.getStats(tenantId);
      res.json({ success: true, message: 'Stats retrieved', data: { stats } });
    } catch (error) {
      next(error);
    }
  },

  async getChartData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const days = parseInt(req.query.days as string) || 30;
      const eventId = req.query.eventId as string | undefined;
      const points = await dashboardService.getChartData(tenantId, Math.min(days, 90), eventId);
      res.json({ success: true, message: 'Chart data retrieved', data: { points } });
    } catch (error) {
      next(error);
    }
  },

  async getEventOptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req);
      const events = await dashboardService.getEventOptions(tenantId);
      res.json({ success: true, message: 'Events retrieved', data: { events } });
    } catch (error) {
      next(error);
    }
  },
};
