import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { attendanceService } from '../services/attendanceService';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const scanValidation = [
  body('qrData').trim().notEmpty().withMessage('QR data is required'),
];

export const attendanceController = {
  // POST /api/admin/attendance/scan
  async scan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'QR data is required' });
        return;
      }
      if (!req.admin) throw new AppError('Unauthorized', 401);

      const { qrData } = req.body as { qrData: string };
      const ipAddress = req.ip ?? req.socket.remoteAddress;

      const result = await attendanceService.scanQR(qrData, String(req.admin._id), ipAddress);

      const httpStatus = result.outcome === 'success' ? 200 : result.outcome === 'duplicate' ? 200 : 422;
      res.status(httpStatus).json({ success: true, message: result.message, data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/attendance/:eventId
  async getAttendanceList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await attendanceService.getAttendanceList(req.params.eventId);
      res.json({ success: true, message: 'Attendance list retrieved', data: { logs } });
    } catch (error) {
      next(error);
    }
  },
};
