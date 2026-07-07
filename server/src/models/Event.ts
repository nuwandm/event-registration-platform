import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export type EventStatus = 'draft' | 'published' | 'closed';

export interface IEvent extends Document {
  name: string;
  slug: string;
  description: string;
  venue: string;
  eventDate: Date;
  registrationOpenDate: Date;
  registrationCloseDate: Date;
  maxParticipants?: number;
  registrationFee: number;
  bankDetails: IBankDetails;
  bannerImage?: string;
  bannerImagePublicId?: string;
  status: EventStatus;
  registrationCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [500, 'Venue cannot exceed 500 characters'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    registrationOpenDate: {
      type: Date,
      required: [true, 'Registration open date is required'],
    },
    registrationCloseDate: {
      type: Date,
      required: [true, 'Registration close date is required'],
    },
    maxParticipants: {
      type: Number,
      min: [1, 'Max participants must be at least 1'],
    },
    registrationFee: {
      type: Number,
      required: [true, 'Registration fee is required'],
      min: [0, 'Registration fee cannot be negative'],
    },
    bankDetails: {
      type: bankDetailsSchema,
      required: [true, 'Bank details are required'],
    },
    bannerImage: { type: String },
    bannerImagePublicId: { type: String },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    registrationCount: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate unique slug from name
eventSchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) return next();

  let baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.model('Event').findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

eventSchema.index({ status: 1, eventDate: -1 });
eventSchema.index({ createdBy: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
