import mongoose, { Document, Schema } from 'mongoose';

export type ScanStatus = 'success' | 'duplicate' | 'invalid';

export interface IAttendanceLog extends Document {
  registrationId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  scannedBy: mongoose.Types.ObjectId;
  scannedAt: Date;
  ipAddress?: string;
  status: ScanStatus;
  createdAt: Date;
}

const attendanceLogSchema = new Schema<IAttendanceLog>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    scannedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    status: {
      type: String,
      enum: ['success', 'duplicate', 'invalid'],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

attendanceLogSchema.index({ eventId: 1, scannedAt: -1 });

export const AttendanceLog = mongoose.model<IAttendanceLog>('AttendanceLog', attendanceLogSchema);
