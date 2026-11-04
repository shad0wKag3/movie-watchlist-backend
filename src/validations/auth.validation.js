import { z } from 'zod';

const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 6 characters and include uppercase, lowercase, number, and special character.';

export const registerSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    password: z
      .string()
      .min(6, PASSWORD_POLICY_MESSAGE)
      .regex(/[A-Z]/, PASSWORD_POLICY_MESSAGE)
      .regex(/[a-z]/, PASSWORD_POLICY_MESSAGE)
      .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE)
      .regex(/[^a-zA-Z0-9]/, PASSWORD_POLICY_MESSAGE),
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

