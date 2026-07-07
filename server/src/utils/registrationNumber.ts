import { Counter } from '../models/Counter';

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
  return `EVT-${year}-${seq}`;
};
