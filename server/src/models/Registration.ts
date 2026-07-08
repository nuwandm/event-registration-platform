import mongoose, { Document, Schema } from 'mongoose';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'not_attended' | 'attended';

export interface IRegistration extends Document {
  tenantId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  registrationNumber: string;
  fullName: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  organization?: string;
  designation?: string;
  receiptUrl: string;
  receiptPublicId: string;
  status: RegistrationStatus;
  qrToken?: string;
  qrCodeUrl?: string;
  attendanceStatus: AttendanceStatus;
  attendanceTime?: Date;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    nic: {
      type: String,
      required: [true, 'NIC / Passport is required'],
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    organization: { type: String, trim: true },
    designation: { type: String, trim: true },
    receiptUrl: {
      type: String,
      required: [true, 'Payment receipt is required'],
    },
    receiptPublicId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    qrCodeUrl: { type: String },
    attendanceStatus: {
      type: String,
      enum: ['not_attended', 'attended'],
      default: 'not_attended',
    },
    attendanceTime: { type: Date },
    adminRemarks: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// Prevent duplicate NIC or email for the same event
registrationSchema.index({ eventId: 1, nic: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
registrationSchema.index({ status: 1, createdAt: -1 });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
