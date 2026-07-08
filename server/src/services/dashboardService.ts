import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { AttendanceLog } from '../models/AttendanceLog';

export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  totalAttended: number;
  todayAttendance: number;
  attendancePercentage: number;
}

export interface ChartPoint {
  date: string;
  registrations: number;
  attendance: number;
}

export const dashboardService = {
  async getStats(tenantId: string): Promise<DashboardStats> {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEvents,
      publishedEvents,
      regCounts,
      totalAttended,
      todayAttendance,
    ] = await Promise.all([
      Event.countDocuments({ tenantId: tid }),
      Event.countDocuments({ tenantId: tid, status: 'published' }),
      Registration.aggregate([
        { $match: { tenantId: tid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Registration.countDocuments({ tenantId: tid, attendanceStatus: 'attended' }),
      AttendanceLog.countDocuments({ tenantId: tid, status: 'success', scannedAt: { $gte: today } }),
    ]);

    const counts = regCounts.reduce(
      (acc: Record<string, number>, r: { _id: string; count: number }) => {
        acc[r._id] = r.count;
        return acc;
      },
      {} as Record<string, number>
    );

    const approved = counts['approved'] ?? 0;
    const attendancePercentage = approved > 0 ? Math.round((totalAttended / approved) * 100) : 0;

    return {
      totalEvents,
      publishedEvents,
      totalRegistrations: (counts['pending'] ?? 0) + approved + (counts['rejected'] ?? 0),
      pendingRegistrations: counts['pending'] ?? 0,
      approvedRegistrations: approved,
      rejectedRegistrations: counts['rejected'] ?? 0,
      totalAttended,
      todayAttendance,
      attendancePercentage,
    };
  },

  async getChartData(tenantId: string, days = 30, eventId?: string): Promise<ChartPoint[]> {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    const regMatch: Record<string, unknown> = { tenantId: tid, createdAt: { $gte: from } };
    const attMatch: Record<string, unknown> = { tenantId: tid, status: 'success', scannedAt: { $gte: from } };

    if (eventId && eventId !== 'all') {
      regMatch.eventId = new mongoose.Types.ObjectId(eventId);
      attMatch.eventId = new mongoose.Types.ObjectId(eventId);
    }

    const [regData, attData] = await Promise.all([
      Registration.aggregate([
        { $match: regMatch },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      AttendanceLog.aggregate([
        { $match: attMatch },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const regMap = new Map(regData.map((d: { _id: string; count: number }) => [d._id, d.count]));
    const attMap = new Map(attData.map((d: { _id: string; count: number }) => [d._id, d.count]));

    const points: ChartPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, registrations: regMap.get(key) ?? 0, attendance: attMap.get(key) ?? 0 });
    }

    return points;
  },

  async getEventOptions(tenantId: string) {
    return Event.find({ tenantId }, '_id name slug status').sort({ createdAt: -1 }).lean();
  },
};
