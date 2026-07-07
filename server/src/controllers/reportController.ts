import { Response, NextFunction } from 'express';
import { reportService, ReportFormat } from '../services/reportService';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const VALID_FORMATS: ReportFormat[] = ['csv', 'excel', 'pdf'];

export const reportController = {
  async exportRegistrations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fmt = (req.query.format as ReportFormat) ?? 'csv';
      if (!VALID_FORMATS.includes(fmt)) throw new AppError('Invalid format. Use csv, excel, or pdf', 400);

      const eventId = req.query.eventId as string | undefined;
      const status = req.query.status as string | undefined;

      const { buffer, contentType, filename } = await reportService.generateRegistrationsReport(fmt, eventId, status);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportAttendance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fmt = (req.query.format as ReportFormat) ?? 'csv';
      if (!VALID_FORMATS.includes(fmt)) throw new AppError('Invalid format. Use csv, excel, or pdf', 400);

      const eventId = req.query.eventId as string | undefined;

      const { buffer, contentType, filename } = await reportService.generateAttendanceReport(fmt, eventId);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },
};
