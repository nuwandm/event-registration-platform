import mongoose from 'mongoose';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { logger } from './logger';

const reset = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  await Admin.deleteMany({});
  logger.info('All admins deleted');

  await Admin.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'super_admin',
  });
  logger.info(`Admin created: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);

  await mongoose.disconnect();
  logger.info('Reset complete');
};

reset().catch((err) => {
  logger.error('Reset failed:', err);
  process.exit(1);
});
