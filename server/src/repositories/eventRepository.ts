import { Event, IEvent, EventStatus } from '../models/Event';
import { PaginatedResult } from '../types';

export interface EventFilters {
  status?: EventStatus;
  search?: string;
}

export interface EventQuery extends EventFilters {
  page: number;
  limit: number;
}

type LeanEvent = IEvent & { _id: unknown };

export const eventRepository = {
  async findPublished(): Promise<LeanEvent[]> {
    return Event.find({ status: 'published' })
      .sort({ eventDate: 1 })
      .select('-bannerImagePublicId')
      .lean() as unknown as LeanEvent[];
  },

  async findBySlugPublic(slug: string): Promise<LeanEvent | null> {
    return Event.findOne({ slug, status: 'published' })
      .select('-bannerImagePublicId')
      .lean() as unknown as LeanEvent | null;
  },

  async findBySlug(slug: string): Promise<LeanEvent | null> {
    return Event.findOne({ slug }).lean() as unknown as LeanEvent | null;
  },

  async findById(id: string): Promise<LeanEvent | null> {
    return Event.findById(id).lean() as unknown as LeanEvent | null;
  },

  async findAllPaginated(query: EventQuery): Promise<PaginatedResult<LeanEvent>> {
    const { page, limit, status, search } = query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as LeanEvent[],
      Event.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(payload: Partial<IEvent>): Promise<IEvent> {
    const event = new Event(payload);
    return event.save();
  },

  async update(id: string, payload: Partial<IEvent>): Promise<IEvent | null> {
    return Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  },

  async delete(id: string): Promise<IEvent | null> {
    return Event.findByIdAndDelete(id);
  },

  async incrementRegistrationCount(id: string): Promise<void> {
    await Event.findByIdAndUpdate(id, { $inc: { registrationCount: 1 } });
  },
};
