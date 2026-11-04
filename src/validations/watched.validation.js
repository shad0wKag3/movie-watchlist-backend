import { z } from 'zod';

export const addWatchedSchema = z
  .object({
    movieId: z.number().int().positive().optional(),
    movie_id: z.number().int().positive().optional(),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    reviewText: z.string().trim().min(1, 'Review text is required').optional(),
    review_text: z.string().trim().min(1, 'Review text is required').optional(),
  })
  .refine((data) => data.movieId !== undefined || data.movie_id !== undefined, {
    message: 'movieId or movie_id is required',
    path: ['movieId'],
  })
  .refine((data) => Boolean(data.reviewText || data.review_text), {
    message: 'reviewText or review_text is required',
    path: ['reviewText'],
  })
  .transform((data) => ({
    movieId: data.movieId ?? data.movie_id,
    rating: data.rating,
    reviewText: data.reviewText ?? data.review_text,
  }));

