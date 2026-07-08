import { Tenant, ITenant, TenantStatus } from '../models/Tenant';
import { PaginatedResult } from '../types';

export interface TenantQuery {
  page: number;
  limit: number;
  status?: TenantStatus;
  search?: string;
}

export const tenantRepository = {
  async create(payload: Partial<ITenant>): Promise<ITenant> {
    const tenant = new Tenant(payload);
    return tenant.save();
  },

  async findBySlug(slug: string): Promise<ITenant | null> {
    return Tenant.findOne({ slug });
  },

  async findById(id: string): Promise<ITenant | null> {
    return Tenant.findById(id);
  },

  async findByEmail(email: string): Promise<ITenant | null> {
    return Tenant.findOne({ contactEmail: email.toLowerCase() });
  },

  async findAllPaginated(query: TenantQuery): Promise<PaginatedResult<ITenant>> {
    const { page, limit, status, search } = query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Tenant.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Tenant.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateById(id: string, payload: Partial<ITenant>): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(id, payload, { new: true });
  },

  async countByStatus(): Promise<Record<string, number>> {
    const results = await Tenant.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return results.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  },
};
