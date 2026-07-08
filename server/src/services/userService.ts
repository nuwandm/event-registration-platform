import { Admin, IAdmin } from '../models/Admin';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  assignedEvents: string[];
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  assignedEvents?: string[];
}

export const userService = {
  async listUsers(tenantId: string): Promise<IAdmin[]> {
    return Admin.find({ role: 'staff', tenantId })
      .populate('assignedEvents', 'name slug eventDate')
      .select('-password')
      .sort({ createdAt: -1 });
  },

  async createUser(tenantId: string, dto: CreateUserDTO): Promise<IAdmin> {
    const existing = await Admin.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new AppError('Email already in use', 409);

    const user = await Admin.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'staff',
      tenantId: new mongoose.Types.ObjectId(tenantId),
      assignedEvents: dto.assignedEvents.map((id) => new mongoose.Types.ObjectId(id)),
    });

    return Admin.findById(user._id)
      .populate('assignedEvents', 'name slug eventDate')
      .select('-password') as Promise<IAdmin>;
  },

  async updateUser(id: string, tenantId: string, dto: UpdateUserDTO): Promise<IAdmin> {
    const user = await Admin.findOne({ _id: id, role: 'staff', tenantId });
    if (!user) throw new AppError('User not found', 404);

    if (dto.name) user.name = dto.name;
    if (dto.email) {
      const exists = await Admin.findOne({ email: dto.email.toLowerCase(), _id: { $ne: id } });
      if (exists) throw new AppError('Email already in use', 409);
      user.email = dto.email.toLowerCase();
    }
    if (dto.password) user.password = dto.password;
    if (dto.assignedEvents !== undefined) {
      user.assignedEvents = dto.assignedEvents.map((eid) => new mongoose.Types.ObjectId(eid));
    }

    await user.save();

    return Admin.findById(user._id)
      .populate('assignedEvents', 'name slug eventDate')
      .select('-password') as Promise<IAdmin>;
  },

  async deleteUser(id: string, tenantId: string): Promise<void> {
    const user = await Admin.findOne({ _id: id, role: 'staff', tenantId });
    if (!user) throw new AppError('User not found', 404);
    await user.deleteOne();
  },

  async getStaffForEvent(eventId: string, tenantId: string): Promise<IAdmin[]> {
    return Admin.find({ role: 'staff', tenantId, assignedEvents: new mongoose.Types.ObjectId(eventId) })
      .select('-password')
      .sort({ name: 1 });
  },

  async setEventStaff(eventId: string, staffIds: string[], tenantId: string): Promise<void> {
    const oid = new mongoose.Types.ObjectId(eventId);
    await Admin.updateMany({ role: 'staff', tenantId, assignedEvents: oid }, { $pull: { assignedEvents: oid } });
    if (staffIds.length > 0) {
      await Admin.updateMany(
        { role: 'staff', tenantId, _id: { $in: staffIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { $addToSet: { assignedEvents: oid } }
      );
    }
  },
};
