import { z } from 'zod';

export const addWatchlistSchema = z
  .object({
    movieId: z.number().int().positive().optional(),
    movie_id: z.number().int().positive().optional(),
  })
  .refine((data) => data.movieId !== undefined || data.movie_id !== undefined, {
    message: 'movieId or movie_id is required',
    path: ['movieId'],
  })
  .transform((data) => ({
    movieId: data.movieId ?? data.movie_id,
  }));

export const watchlistParamSchema = z.object({
  movieId: z
    .string()
    .regex(/^\d+$/, 'Movie ID must be a numeric integer')
    .transform((val) => parseInt(val, 10)),
});

