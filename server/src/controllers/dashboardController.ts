import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { AuthRequest } from '../types';

export const dashboardController = {
  async getStats(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      res.json({ success: true, message: 'Stats retrieved', data: { stats } });
    } catch (error) {
      next(error);
    }
  },

  async getChartData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const eventId = req.query.eventId as string | undefined;
      const points = await dashboardService.getChartData(Math.min(days, 90), eventId);
      res.json({ success: true, message: 'Chart data retrieved', data: { points } });
    } catch (error) {
      next(error);
    }
  },

  async getEventOptions(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await dashboardService.getEventOptions();
      res.json({ success: true, message: 'Events retrieved', data: { events } });
    } catch (error) {
      next(error);
    }
  },
};
