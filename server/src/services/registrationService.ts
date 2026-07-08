import mongoose from 'mongoose';
import { registrationRepository, RegistrationQuery } from '../repositories/registrationRepository';
import { eventRepository } from '../repositories/eventRepository';
import { uploadService } from './uploadService';
import { qrService } from './qrService';
import { AppError } from '../middleware/errorHandler';
import { generateRegistrationNumber } from '../utils/registrationNumber';
import { PaginatedResult } from '../types';
import { IRegistration } from '../models/Registration';

export interface SubmitRegistrationDTO {
  fullName: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  organization?: string;
  designation?: string;
  answers?: Array<{ questionId: string; answer: string | string[] }>;
}

type LeanOrDoc = IRegistration & { _id: unknown };

export const registrationService = {
  async submitRegistration(
    eventId: string,
    tenantId: string,
    dto: SubmitRegistrationDTO,
    receiptFile: Express.Multer.File
  ): Promise<IRegistration> {
    // 1. Validate event exists and is published within this tenant
    const byId = await eventRepository.findByIdForTenant(eventId, tenantId);
    if (!byId || byId.status !== 'published') {
      throw new AppError('Event not found or registration is not open', 404);
    }

    const targetEvent = byId;
    const now = new Date();

    if (now < new Date(targetEvent.registrationOpenDate)) {
      throw new AppError('Registration has not opened yet', 400);
    }
    if (now > new Date(targetEvent.registrationCloseDate)) {
      throw new AppError('Registration is closed', 400);
    }

    // 2. Check max participants
    if (targetEvent.maxParticipants && targetEvent.registrationCount >= targetEvent.maxParticipants) {
      throw new AppError('This event has reached maximum capacity', 400);
    }

    // 3. Check duplicates (NIC or email for same event)
    const targetEventId = String(targetEvent._id);
    const duplicate = await registrationRepository.findDuplicate(targetEventId, dto.nic, dto.email);
    if (duplicate) {
      const field = duplicate.nic === dto.nic.toUpperCase() ? 'NIC / Passport' : 'email address';
      throw new AppError(
        `A registration with this ${field} already exists for this event`,
        409
      );
    }

    // 4. Upload receipt to Cloudinary
    const { url: receiptUrl, publicId: receiptPublicId } = await uploadService.uploadFile(
      receiptFile.buffer,
      `eventhub/${tenantId}/receipts`,
      receiptFile.originalname
    );

    // 5. Generate registration number atomically
    const registrationNumber = await generateRegistrationNumber(targetEventId);

    // 6. Create registration
    const registration = await registrationRepository.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      eventId: new mongoose.Types.ObjectId(targetEventId),
      registrationNumber,
      ...dto,
      nic: dto.nic.toUpperCase(),
      email: dto.email.toLowerCase(),
      receiptUrl,
      receiptPublicId,
      status: 'pending',
      attendanceStatus: 'not_attended',
      answers: dto.answers ?? [],
    });

    // 7. Increment event registration counter
    await eventRepository.incrementRegistrationCount(targetEventId);

    return registration;
  },

  async getRegistrationStatus(id: string): Promise<LeanOrDoc> {
    const reg = await registrationRepository.findByIdLean(id);
    if (!reg) throw new AppError('Registration not found', 404);
    return reg;
  },

  async getStatusByRegistrationNumber(registrationNumber: string): Promise<LeanOrDoc> {
    const reg = await registrationRepository.findByRegistrationNumber(registrationNumber);
    if (!reg) throw new AppError('No registration found with this reference number', 404);
    return reg;
  },

  async getAllRegistrations(query: RegistrationQuery): Promise<PaginatedResult<LeanOrDoc>> {
    return registrationRepository.findAllPaginated(query);
  },

  async getRegistrationById(id: string): Promise<IRegistration> {
    const reg = await registrationRepository.findById(id);
    if (!reg) throw new AppError('Registration not found', 404);
    return reg;
  },

  async approveRegistration(id: string, remarks?: string): Promise<IRegistration> {
    const reg = await registrationRepository.findById(id);
    if (!reg) throw new AppError('Registration not found', 404);

    if (reg.status === 'approved') {
      throw new AppError('Registration is already approved', 400);
    }
    if (reg.status === 'rejected') {
      throw new AppError('Rejected registrations cannot be approved', 400);
    }

    const { token, qrCodeUrl } = await qrService.generateQR(id);

    const updated = await registrationRepository.updateById(id, {
      status: 'approved',
      qrToken: token,
      qrCodeUrl,
      adminRemarks: remarks ?? undefined,
    });

    if (!updated) throw new AppError('Registration not found', 404);
    return updated;
  },

  async rejectRegistration(id: string, remarks: string): Promise<IRegistration> {
    const reg = await registrationRepository.findById(id);
    if (!reg) throw new AppError('Registration not found', 404);

    if (reg.status === 'rejected') {
      throw new AppError('Registration is already rejected', 400);
    }

    const updated = await registrationRepository.updateById(id, {
      status: 'rejected',
      adminRemarks: remarks,
    });

    if (!updated) throw new AppError('Registration not found', 404);
    return updated;
  },

  async deleteRegistration(id: string, _reason: string): Promise<void> {
    const reg = await registrationRepository.findById(id);
    if (!reg) throw new AppError('Registration not found', 404);
    await registrationRepository.deleteById(id);
    // Decrement the event's registrationCount so the badge stays accurate
    await eventRepository.decrementRegistrationCount(String(reg.eventId));
  },

  async updateRegistration(
    id: string,
    payload: { status?: 'pending' | 'approved' | 'rejected'; attendanceStatus?: 'attended' | 'not_attended'; adminRemarks?: string }
  ): Promise<IRegistration> {
    const reg = await registrationRepository.findById(id);
    if (!reg) throw new AppError('Registration not found', 404);

    const update: Partial<IRegistration> = {};

    if (payload.status && payload.status !== reg.status) {
      if (payload.status === 'approved' && !reg.qrToken) {
        const { token, qrCodeUrl } = await qrService.generateQR(id);
        update.qrToken = token;
        update.qrCodeUrl = qrCodeUrl;
      }
      update.status = payload.status;
    }

    if (payload.attendanceStatus !== undefined) {
      const effectiveStatus = payload.status ?? reg.status;
      if (effectiveStatus !== 'approved') {
        throw new AppError('Attendance can only be set for approved registrations', 400);
      }
      update.attendanceStatus = payload.attendanceStatus;
      if (payload.attendanceStatus === 'attended' && !reg.attendanceTime) {
        update.attendanceTime = new Date();
      }
      if (payload.attendanceStatus === 'not_attended') {
        update.attendanceTime = undefined;
      }
    }

    if (payload.adminRemarks !== undefined) {
      update.adminRemarks = payload.adminRemarks;
    }

    const updated = await registrationRepository.updateById(id, update);
    if (!updated) throw new AppError('Registration not found', 404);
    return updated;
  },
};
