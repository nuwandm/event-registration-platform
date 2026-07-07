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
  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEvents,
      publishedEvents,
      regCounts,
      totalAttended,
      todayAttendance,
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      Registration.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Registration.countDocuments({ attendanceStatus: 'attended' }),
      AttendanceLog.countDocuments({ status: 'success', scannedAt: { $gte: today } }),
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

  async getChartData(days = 30): Promise<ChartPoint[]> {
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    const [regData, attData] = await Promise.all([
      Registration.aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AttendanceLog.aggregate([
        { $match: { status: 'success', scannedAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build a map for O(1) lookup
    const regMap = new Map(regData.map((d: { _id: string; count: number }) => [d._id, d.count]));
    const attMap = new Map(attData.map((d: { _id: string; count: number }) => [d._id, d.count]));

    // Fill every day in the range
    const points: ChartPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      points.push({
        date: key,
        registrations: regMap.get(key) ?? 0,
        attendance: attMap.get(key) ?? 0,
      });
    }

    return points;
  },

  async getEventOptions() {
    return Event.find({}, '_id name slug status').sort({ createdAt: -1 }).lean();
  },
};
