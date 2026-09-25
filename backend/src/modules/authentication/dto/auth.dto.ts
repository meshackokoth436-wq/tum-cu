import { z } from 'zod';

export const passwordPolicy = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');

export const registerSchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone_number: z.preprocess((value) => {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized === '' ? undefined : normalized;
    }
    return value;
  }, z.string().regex(/^\+?[0-9]{7,18}$/, 'Invalid phone number').optional()),
  admission_number: z.preprocess((value) => {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized === '' ? undefined : normalized;
    }
    return value;
  }, z.string().min(2).max(50).optional()),
  country: z.string().min(2).max(100).optional(),
  location: z.string().min(2).max(150).optional(),
  affiliation: z.string().min(2).max(200).optional(),
  department: z.preprocess((value) => {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized === '' ? undefined : normalized;
    }
    return value;
  }, z.string().min(2).max(150).optional()),
  year_of_study: z.coerce.number().int().min(1).max(7).optional(),
  password: passwordPolicy,
  membership_type: z.enum(['full', 'special', 'associate']),
  declaration_accepted: z.literal(true, {
    errorMap: () => ({ message: 'Membership declaration must be accepted' }),
  }),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Email, admission number, or phone is required'),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({});
export type RefreshDto = z.infer<typeof refreshSchema>;
