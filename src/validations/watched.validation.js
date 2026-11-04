import { z } from 'zod';

export const addWatchedSchema = z
  .object({
    movieId: z.union([z.number(), z.string()]),
    rating: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    reviewText: z.string().optional(),
    review_text: z.string().optional(),
    review: z.string().optional(),
    comment: z.string().optional(),
  })
  .transform((data, ctx) => {
    const text = data.reviewText ?? data.review_text ?? data.review ?? data.comment;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'reviewText or review_text is required',
        path: ['reviewText'],
      });
      return z.NEVER;
    }

    return {
      movieId: Number(data.movieId),
      rating: data.rating,
      reviewText: text.trim(),
    };
  });

export default {
  addWatchedSchema,
};