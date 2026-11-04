import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // Accept either 'name' or 'username' — both optional individually but one must be present
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    username: z.string().trim().min(2, 'Username must be at least 2 characters').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.name && !data.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either name or username is required (min 2 characters)',
        path: ['name'],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

