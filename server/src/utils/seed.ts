import mongoose from 'mongoose';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { logger } from './logger';

const seed = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB for seeding');

  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL });

  if (existing) {
    logger.info(`Admin already exists: ${env.ADMIN_EMAIL}`);
  } else {
    await Admin.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'super_admin',
    });
    logger.info(`Admin created: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  }

  await mongoose.disconnect();
  logger.info('Seed complete');
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
