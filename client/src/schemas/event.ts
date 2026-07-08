import { z } from 'zod';

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  branch: z.string().min(1, 'Branch is required'),
});

export const questionSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1, 'Question label is required'),
  type: z.enum(['text', 'textarea', 'radio', 'checkbox', 'dropdown']),
  options: z.array(z.string()).default([]),
  required: z.boolean().default(false),
});

export const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  venue: z.string().min(1, 'Venue is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  registrationOpenDate: z.string().min(1, 'Registration open date is required'),
  registrationCloseDate: z.string().min(1, 'Registration close date is required'),
  registrationFee: z.coerce.number().min(0, 'Fee cannot be negative'),
  maxParticipants: z.union([
    z.number().min(1),
    z.string().transform((v) => (v === '' ? undefined : Number(v))).pipe(z.number().min(1).optional()),
  ]).optional(),
  status: z.enum(['draft', 'published', 'closed']),
  bankDetails: bankDetailsSchema,
  bannerPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  questions: z.array(questionSchema).default([]),
});

export interface QuestionFormValue {
  _id?: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'dropdown';
  options: string[];
  required: boolean;
}

export interface EventFormValues {
  name: string;
  description: string;
  venue: string;
  eventDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  registrationFee: number;
  maxParticipants?: number;
  status: 'draft' | 'published' | 'closed';
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  bannerPosition?: { x: number; y: number };
  questions: QuestionFormValue[];
}
