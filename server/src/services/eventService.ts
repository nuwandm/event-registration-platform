import { eventRepository, EventQuery } from '../repositories/eventRepository';
import { uploadService } from './uploadService';
import { IEvent, QuestionType } from '../models/Event';
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
  questions?: Array<{ label: string; type: QuestionType; options: string[]; required: boolean }>;
  contactPhone?: string;
  whatsappNumber?: string;
}

export const eventService = {
  async getPublishedEvents(tenantId: string): Promise<LeanOrDoc[]> {
    return eventRepository.findPublished(tenantId);
  },

  async getPublicEventBySlug(slug: string, tenantId: string): Promise<LeanOrDoc> {
    const event = await eventRepository.findBySlugPublic(slug, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async getAllEventsPaginated(query: EventQuery): Promise<PaginatedResult<LeanOrDoc>> {
    return eventRepository.findAllPaginated(query);
  },

  async getEventById(id: string, tenantId: string): Promise<LeanOrDoc> {
    const event = await eventRepository.findByIdForTenant(id, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async createEvent(
    dto: CreateEventDTO,
    tenantId: string,
    adminId: string,
    bannerFile?: Express.Multer.File
  ): Promise<IEvent> {
    let bannerImage: string | undefined;
    let bannerImagePublicId: string | undefined;

    if (bannerFile) {
      const result = await uploadService.uploadImage(bannerFile.buffer, `eventhub/${tenantId}/banners`);
      bannerImage = result.url;
      bannerImagePublicId = result.publicId;
    }

    const questions = (dto.questions ?? []).map(({ label, type, options, required }) => ({
      label, type, options, required,
    }));

    const event = await eventRepository.create({
      ...dto,
      questions,
      tenantId: tenantId as unknown as import('mongoose').Types.ObjectId,
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
    tenantId: string,
    dto: Partial<CreateEventDTO>,
    bannerFile?: Express.Multer.File
  ): Promise<IEvent> {
    const existing = await eventRepository.findByIdForTenant(id, tenantId);
    if (!existing) throw new AppError('Event not found', 404);

    const payload: Partial<IEvent> & { bannerPosition?: { x: number; y: number } } = { ...dto } as Partial<IEvent>;

    if (dto.eventDate) payload.eventDate = new Date(dto.eventDate);
    if (dto.registrationOpenDate) payload.registrationOpenDate = new Date(dto.registrationOpenDate);
    if (dto.registrationCloseDate) payload.registrationCloseDate = new Date(dto.registrationCloseDate);
    if (dto.questions) {
      payload.questions = dto.questions.map(({ label, type, options, required }) => ({
        label, type, options, required,
      })) as IEvent['questions'];
    }

    if (bannerFile) {
      if (existing.bannerImagePublicId) {
        await uploadService.deleteFile(existing.bannerImagePublicId);
      }
      const result = await uploadService.uploadImage(bannerFile.buffer, `eventhub/${tenantId}/banners`);
      payload.bannerImage = result.url;
      payload.bannerImagePublicId = result.publicId;
    }

    const updated = await eventRepository.update(id, payload);
    if (!updated) throw new AppError('Event not found', 404);
    return updated;
  },

  async toggleAdmission(id: string, tenantId: string): Promise<IEvent> {
    const existing = await eventRepository.findByIdForTenant(id, tenantId);
    if (!existing) throw new AppError('Event not found', 404);
    const updated = await eventRepository.update(id, { admissionOpen: !existing.admissionOpen } as Partial<IEvent>);
    if (!updated) throw new AppError('Event not found', 404);
    return updated;
  },

  async deleteEvent(id: string, tenantId: string): Promise<void> {
    const event = await eventRepository.findByIdForTenant(id, tenantId);
    if (!event) throw new AppError('Event not found', 404);

    if (event.bannerImagePublicId) {
      await uploadService.deleteFile(event.bannerImagePublicId);
    }

    await eventRepository.delete(id);
  },
};
