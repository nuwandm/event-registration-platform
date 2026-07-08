import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
    assignedEvents: string[];
  };
}

const generateToken = (adminId: string): string => {
  return jwt.sign({ id: adminId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const authService = {
  async login(dto: LoginDTO): Promise<AuthResult> {
    const admin = await Admin.findOne({ email: dto.email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(dto.password))) {
      throw new AppError('Invalid email or password', 401);
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
        assignedEvents: admin.assignedEvents.map(String),
      },
    };
  },

  async getMe(adminId: string): Promise<Omit<IAdmin, 'password'>> {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new AppError('Admin not found', 404);
    return admin;
  },
};
