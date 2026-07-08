import mongoose, { Document, Schema } from 'mongoose';

export type TenantStatus = 'pending' | 'active' | 'suspended';

export interface ITenant extends Document {
  name: string;
  slug: string;
  contactEmail: string;
  logoUrl?: string;
  logoPublicId?: string;
  primaryColor: string;
  status: TenantStatus;
  rejectionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    logoUrl: { type: String },
    logoPublicId: { type: String },
    primaryColor: {
      type: String,
      default: '#2563eb',
      match: [/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
