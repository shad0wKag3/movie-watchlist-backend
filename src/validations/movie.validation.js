import { z } from 'zod';

export const movieQuerySchema = z.object({
  search: z.string().optional(),
  shuffle: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true' || val === '1';
      }
      return Boolean(val);
    }),
  genre: z.string().optional(),
});

export const movieIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Movie ID must be a numeric integer')
    .transform((val) => parseInt(val, 10)),
});

export const recommendSchema = z
  .object({
    prompt: z.string().trim().optional(),
    mood: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.prompt || data.mood), {
    message: 'Either "prompt" or "mood" must be provided',
    path: ['prompt'],
  });

