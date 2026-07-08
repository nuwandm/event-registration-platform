import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin';
import { Tenant } from '../models/Tenant';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export interface LoginDTO {
  email: string;
  password: string;
  orgSlug?: string;
}

export interface AuthResult {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId?: string;
    assignedEvents: string[];
  };
}

const generateToken = (adminId: string): string => {
  return jwt.sign({ id: adminId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const authService = {
  // Platform login — email + password only, no orgSlug required.
  // Returns token + orgSlug so the frontend can redirect automatically.
  async platformLogin(dto: { email: string; password: string }): Promise<AuthResult & { orgSlug?: string }> {
    const admin = await Admin.findOne({ email: dto.email.toLowerCase() }).select('+password');
    if (!admin || !(await admin.comparePassword(dto.password))) {
      throw new AppError('Invalid email or password', 401);
    }
    // Super admin — return token with no orgSlug, frontend redirects to /superadmin
    if (admin.role === 'super_admin') {
      const token = generateToken(String(admin._id));
      return {
        token,
        orgSlug: undefined,
        admin: {
          id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          assignedEvents: [],
        },
      };
    }

    if (!admin.tenantId) {
      throw new AppError('Account is not linked to an organization', 403);
    }
    const tenant = await Tenant.findById(admin.tenantId);
    if (!tenant) throw new AppError('Organization not found', 404);
    if (tenant.status === 'pending') throw new AppError('Your organization is pending approval. Please wait for approval.', 403);
    if (tenant.status === 'suspended') throw new AppError('Your organization has been suspended. Contact support.', 403);

    const token = generateToken(String(admin._id));
    return {
      token,
      orgSlug: tenant.slug,
      admin: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: String(admin.tenantId),
        assignedEvents: admin.assignedEvents.map(String),
      },
    };
  },

  async login(dto: LoginDTO): Promise<AuthResult> {
    const admin = await Admin.findOne({ email: dto.email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(dto.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    // Super admin can log in from anywhere (no orgSlug check)
    if (admin.role === 'super_admin') {
      if (dto.orgSlug) {
        throw new AppError('Super admin cannot log in as an organization', 403);
      }
    } else {
      // org_admin / staff must provide a matching orgSlug
      if (!dto.orgSlug) {
        throw new AppError('Organization slug is required', 400);
      }
      const tenant = await Tenant.findOne({ slug: dto.orgSlug });
      if (!tenant) throw new AppError('Organization not found', 404);
      if (tenant.status !== 'active') throw new AppError('This organization is not active', 403);
      if (!admin.tenantId || String(admin.tenantId) !== String(tenant._id)) {
        throw new AppError('Invalid email or password', 401);
      }
    }

    const adminId = String(admin._id);
    const token = generateToken(adminId);

    return {
      token,
      admin: {
        id: adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: admin.tenantId ? String(admin.tenantId) : undefined,
        assignedEvents: admin.assignedEvents.map(String),
      },
    };
  },

  async getMe(adminId: string): Promise<Omit<IAdmin, 'password'>> {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new AppError('Admin not found', 404);
    return admin;
  },

  async changePassword(adminId: string, dto: { currentPassword: string; newPassword: string }): Promise<void> {
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) throw new AppError('Admin not found', 404);
    if (!(await admin.comparePassword(dto.currentPassword))) {
      throw new AppError('Current password is incorrect', 400);
    }
    admin.password = dto.newPassword;
    await admin.save(); // pre-save hook hashes the new password
  },
};
