import { Registration, IRegistration, RegistrationStatus } from '../models/Registration';
import { PaginatedResult } from '../types';

export interface RegistrationQuery {
  page: number;
  limit: number;
  tenantId: string;
  status?: RegistrationStatus | 'attended' | 'not_attended';
  eventId?: string;
  search?: string;
}

type LeanRegistration = IRegistration & { _id: unknown };

export const registrationRepository = {
  async findDuplicate(eventId: string, nic: string, email: string): Promise<IRegistration | null> {
    return Registration.findOne({
      eventId,
      $or: [{ nic: nic.toUpperCase() }, { email: email.toLowerCase() }],
    });
  },

  async create(payload: Partial<IRegistration>): Promise<IRegistration> {
    const reg = new Registration(payload);
    return reg.save();
  },

  async findById(id: string): Promise<IRegistration | null> {
    return Registration.findById(id).populate('eventId', 'name slug venue eventDate registrationFee bankDetails admissionOpen');
  },

  async findByIdLean(id: string): Promise<LeanRegistration | null> {
    return Registration.findById(id)
      .populate('eventId', 'name slug venue eventDate')
      .lean() as unknown as LeanRegistration | null;
  },

  async findAllPaginated(query: RegistrationQuery): Promise<PaginatedResult<LeanRegistration>> {
    const { page, limit, tenantId, status, eventId, search } = query;
    const filter: Record<string, unknown> = { tenantId };

    if (eventId) filter.eventId = eventId;

    if (status === 'attended') {
      filter.attendanceStatus = 'attended';
    } else if (status === 'not_attended') {
      filter.status = 'approved';
      filter.attendanceStatus = 'not_attended';
    } else if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Registration.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('eventId', 'name slug')
        .lean() as unknown as LeanRegistration[],
      Registration.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateById(id: string, payload: Partial<IRegistration>): Promise<IRegistration | null> {
    return Registration.findByIdAndUpdate(id, payload, { new: true });
  },

  async deleteById(id: string): Promise<void> {
    await Registration.findByIdAndDelete(id);
  },

  async findByToken(qrToken: string): Promise<IRegistration | null> {
    return Registration.findOne({ qrToken }).populate('eventId', 'name venue eventDate admissionOpen');
  },

  async findByRegistrationNumber(registrationNumber: string): Promise<LeanRegistration | null> {
    return Registration.findOne({ registrationNumber: registrationNumber.toUpperCase() })
      .populate('eventId', 'name slug venue eventDate')
      .lean() as unknown as LeanRegistration | null;
  },

  async countByEvent(eventId: string): Promise<Record<string, number>> {
    const results = await Registration.aggregate([
      { $match: { eventId: new (require('mongoose').Types.ObjectId)(eventId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return results.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  },
};
