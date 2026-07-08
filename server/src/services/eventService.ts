import { eventRepository, EventQuery } from '../repositories/eventRepository';
import { uploadService } from './uploadService';
import { IEvent } from '../models/Event';
import { AppError } from '../middleware/errorHandler';
import { PaginatedResult } from '../types';

type LeanOrDoc = IEvent | (IEvent & { _id: unknown });

export interface CreateEventDTO {
  name: string;
  description: string;
  venue: string;
  eventDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  maxParticipants?: number;
  registrationFee: number;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  status?: 'draft' | 'published' | 'closed';
  bannerPosition?: { x: number; y: number };
}

export const eventService = {
  async getPublishedEvents(): Promise<LeanOrDoc[]> {
    return eventRepository.findPublished();
  },

  async getPublicEventBySlug(slug: string): Promise<LeanOrDoc> {
    const event = await eventRepository.findBySlugPublic(slug);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async getAllEventsPaginated(query: EventQuery): Promise<PaginatedResult<LeanOrDoc>> {
    return eventRepository.findAllPaginated(query);
  },

  async getEventById(id: string): Promise<LeanOrDoc> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async createEvent(
    dto: CreateEventDTO,
    adminId: string,
    bannerFile?: Express.Multer.File
  ): Promise<IEvent> {
    let bannerImage: string | undefined;
    let bannerImagePublicId: string | undefined;

    if (bannerFile) {
      const result = await uploadService.uploadImage(bannerFile.buffer, 'eventhub/banners');
      bannerImage = result.url;
      bannerImagePublicId = result.publicId;
    }

    const event = await eventRepository.create({
      ...dto,
      eventDate: new Date(dto.eventDate),
      registrationOpenDate: new Date(dto.registrationOpenDate),
      registrationCloseDate: new Date(dto.registrationCloseDate),
      bannerImage,
      bannerImagePublicId,
      bannerPosition: dto.bannerPosition,
      createdBy: adminId as unknown as import('mongoose').Types.ObjectId,
    });

    return event;
  },

  async updateEvent(
    id: string,
    dto: Partial<CreateEventDTO>,
    bannerFile?: Express.Multer.File
  ): Promise<IEvent> {
    const existing = await eventRepository.findById(id);
    if (!existing) throw new AppError('Event not found', 404);

    const payload: Partial<IEvent> & { bannerPosition?: { x: number; y: number } } = { ...dto } as Partial<IEvent>;

    if (dto.eventDate) payload.eventDate = new Date(dto.eventDate);
    if (dto.registrationOpenDate) payload.registrationOpenDate = new Date(dto.registrationOpenDate);
    if (dto.registrationCloseDate) payload.registrationCloseDate = new Date(dto.registrationCloseDate);

    if (bannerFile) {
      // Delete old banner if it exists
      if (existing.bannerImagePublicId) {
        await uploadService.deleteFile(existing.bannerImagePublicId);
      }
      const result = await uploadService.uploadImage(bannerFile.buffer, 'eventhub/banners');
      payload.bannerImage = result.url;
      payload.bannerImagePublicId = result.publicId;
    }

    const updated = await eventRepository.update(id, payload);
    if (!updated) throw new AppError('Event not found', 404);
    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    if (event.bannerImagePublicId) {
      await uploadService.deleteFile(event.bannerImagePublicId);
    }

    await eventRepository.delete(id);
  },
};
