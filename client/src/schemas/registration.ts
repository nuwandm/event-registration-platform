import { z } from 'zod';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(200, 'Name is too long'),
  nic: z
    .string()
    .min(1, 'NIC / Passport number is required')
    .max(20, 'NIC / Passport is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .max(20, 'Mobile number is too long'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address is too long'),
  organization: z.string().max(200).optional().or(z.literal('')),
  designation: z.string().max(200).optional().or(z.literal('')),
  receipt: z
    .instanceof(File, { message: 'Payment receipt is required' })
    .refine((f) => f.size <= MAX_SIZE, 'File must be under 10 MB')
    .refine((f) => ACCEPTED_TYPES.includes(f.type), 'Only JPG, PNG, or PDF allowed'),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
