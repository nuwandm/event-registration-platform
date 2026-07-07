import mongoose from 'mongoose';
import { AttendanceLog, IAttendanceLog, ScanStatus } from '../models/AttendanceLog';

type LeanLog = IAttendanceLog & { _id: unknown };

export const attendanceRepository = {
  async createLog(payload: {
    registrationId: string;
    eventId: string;
    scannedBy: string;
    ipAddress?: string;
    status: ScanStatus;
  }): Promise<IAttendanceLog> {
    return AttendanceLog.create({
      registrationId: new mongoose.Types.ObjectId(payload.registrationId),
      eventId: new mongoose.Types.ObjectId(payload.eventId),
      scannedBy: new mongoose.Types.ObjectId(payload.scannedBy),
      ipAddress: payload.ipAddress,
      status: payload.status,
      scannedAt: new Date(),
    });
  },

  async findByEvent(eventId: string, limit = 50): Promise<LeanLog[]> {
    return AttendanceLog.find({ eventId: new mongoose.Types.ObjectId(eventId), status: 'success' })
      .sort({ scannedAt: -1 })
      .limit(limit)
      .populate('registrationId', 'fullName nic registrationNumber email')
      .lean() as unknown as LeanLog[];
  },

  async countTodayByEvent(eventId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return AttendanceLog.countDocuments({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'success',
      scannedAt: { $gte: start },
    });
  },

  async countTodayAll(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return AttendanceLog.countDocuments({ status: 'success', scannedAt: { $gte: start } });
  },
};
