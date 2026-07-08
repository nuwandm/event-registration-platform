import { tenantRepository, TenantQuery } from '../repositories/tenantRepository';
import { ITenant } from '../models/Tenant';
import { AppError } from '../middleware/errorHandler';
import { uploadService } from './uploadService';
import { PaginatedResult } from '../types';

export interface CreateTenantDTO {
  name: string;
  slug: string;
  contactEmail: string;
  primaryColor?: string;
}

export interface SignupTenantDTO extends CreateTenantDTO {
  adminName: string;
  adminPassword: string;
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

export const tenantService = {
  generateSlug(name: string): string {
    return slugify(name);
  },

  async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await tenantRepository.findBySlug(slug);
    return !existing;
  },

  async signup(
    dto: SignupTenantDTO,
    logoFile?: Express.Multer.File
  ): Promise<ITenant> {
    const slug = dto.slug || slugify(dto.name);

    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new AppError('Slug can only contain lowercase letters, numbers and hyphens', 400);
    }

    const slugTaken = await tenantRepository.findBySlug(slug);
    if (slugTaken) throw new AppError('This organization URL is already taken', 409);

    let logoUrl: string | undefined;
    let logoPublicId: string | undefined;

    if (logoFile) {
      const result = await uploadService.uploadImage(logoFile.buffer, 'eventhub/logos');
      logoUrl = result.url;
      logoPublicId = result.publicId;
    }

    const tenant = await tenantRepository.create({
      name: dto.name,
      slug,
      contactEmail: dto.contactEmail.toLowerCase(),
      primaryColor: dto.primaryColor || '#2563eb',
      logoUrl,
      logoPublicId,
      status: 'pending',
    });

    return tenant;
  },

  async getAll(query: TenantQuery): Promise<PaginatedResult<ITenant>> {
    return tenantRepository.findAllPaginated(query);
  },

  async getById(id: string): Promise<ITenant> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    return tenant;
  },

  async getBySlug(slug: string): Promise<ITenant> {
    const tenant = await tenantRepository.findBySlug(slug);
    if (!tenant) throw new AppError('Organization not found', 404);
    return tenant;
  },

  async approve(id: string): Promise<ITenant> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    if (tenant.status === 'active') throw new AppError('Tenant is already active', 400);

    const updated = await tenantRepository.updateById(id, {
      status: 'active',
      rejectionNote: undefined,
    });
    if (!updated) throw new AppError('Tenant not found', 404);
    return updated;
  },

  async reject(id: string, note: string): Promise<ITenant> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);

    const updated = await tenantRepository.updateById(id, {
      status: 'pending',
      rejectionNote: note,
    });
    if (!updated) throw new AppError('Tenant not found', 404);
    return updated;
  },

  async suspend(id: string): Promise<ITenant> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);

    const updated = await tenantRepository.updateById(id, { status: 'suspended' });
    if (!updated) throw new AppError('Tenant not found', 404);
    return updated;
  },

  async updateBranding(
    id: string,
    payload: { name?: string; primaryColor?: string },
    logoFile?: Express.Multer.File
  ): Promise<ITenant> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);

    const update: Partial<ITenant> = {};
    if (payload.name) update.name = payload.name;
    if (payload.primaryColor) update.primaryColor = payload.primaryColor;

    if (logoFile) {
      if (tenant.logoPublicId) await uploadService.deleteFile(tenant.logoPublicId);
      const result = await uploadService.uploadImage(logoFile.buffer, 'eventhub/logos');
      update.logoUrl = result.url;
      update.logoPublicId = result.publicId;
    }

    const updated = await tenantRepository.updateById(id, update);
    if (!updated) throw new AppError('Tenant not found', 404);
    return updated;
  },

  async getStats(): Promise<Record<string, number>> {
    return tenantRepository.countByStatus();
  },
};
