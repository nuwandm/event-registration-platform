import { randomBytes } from 'crypto';
import { Counter } from '../models/Counter';

// 6-char uppercase alphanumeric token (A-Z, 0-9 excluding O, 0, I, 1 for readability)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateToken = (): string => {
  const bytes = randomBytes(6);
  return Array.from(bytes).map((b) => CHARS[b % CHARS.length]).join('');
};

export const generateRegistrationNumber = async (eventId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `reg-${eventId}-${year}`;

  // Atomic increment — safe under concurrent requests
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const seq = String(counter.value).padStart(6, '0');
  const token = generateToken();
  // Format: EVT-2026-000001-A3K9XZ  (token makes enumeration infeasible)
  return `EVT-${year}-${seq}-${token}`;
};
