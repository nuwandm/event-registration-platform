import { z } from 'zod';

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  branch: z.string().min(1, 'Branch is required'),
});

export const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  venue: z.string().min(1, 'Venue is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  registrationOpenDate: z.string().min(1, 'Registration open date is required'),
  registrationCloseDate: z.string().min(1, 'Registration close date is required'),
  registrationFee: z.coerce.number().min(0, 'Fee cannot be negative'),
  maxParticipants: z.coerce.number().min(1).optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'closed']),
  bankDetails: bankDetailsSchema,
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
