import { jest } from '@jest/globals';
import { prisma } from '../../src/prisma.js';
import * as watchedService from '../../src/services/watched.service.js';
import { AppError } from '../../src/errors/appError.js';

describe('Watched Service - Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWatchedHistory', () => {
    it('should return watched history for user', async () => {
      const mockHistory = [
        {
          id: 'watched-1',
          user_id: 'user-123',
          movie_id: 1,
          rating: 5,
          review_text: 'Masterpiece of cinema',
          movie: { id: 1, title: 'Inception' },
        },
      ];

      jest.spyOn(prisma.watched, 'findMany').mockResolvedValue(mockHistory);

      const result = await watchedService.getWatchedHistory('user-123');

      expect(prisma.watched.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        include: { movie: true },
        orderBy: { watched_at: 'desc' },
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('addWatchedMovie', () => {
    it('should log watched movie with rating and review', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({ id: 2, title: 'Parasite' });
      jest.spyOn(prisma.watched, 'create').mockResolvedValue({
        id: 'watched-2',
        user_id: 'user-123',
        movie_id: 2,
        rating: 5,
        review_text: 'Incredible commentary and thrilling plot!',
        movie: { id: 2, title: 'Parasite' },
      });

      const result = await watchedService.addWatchedMovie('user-123', {
        movieId: 2,
        rating: 5,
        reviewText: 'Incredible commentary and thrilling plot!',
      });

      expect(prisma.movie.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prisma.watched.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-123',
          movie_id: 2,
          rating: 5,
          review_text: 'Incredible commentary and thrilling plot!',
        },
        include: { movie: true },
      });
      expect(result.id).toBe('watched-2');
    });

    it('should throw 404 if movie does not exist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null);

      await expect(
        watchedService.addWatchedMovie('user-123', {
          movieId: 999,
          rating: 4,
          reviewText: 'Great film',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw 409 Conflict if movie was already logged by user', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({ id: 2, title: 'Parasite' });

      const prismaError = new Error('Unique constraint failed');
      prismaError.code = 'P2002';
      jest.spyOn(prisma.watched, 'create').mockRejectedValue(prismaError);

      await expect(
        watchedService.addWatchedMovie('user-123', {
          movieId: 2,
          rating: 4,
          reviewText: 'Great movie again',
        })
      ).rejects.toThrow(AppError);

      try {
        await watchedService.addWatchedMovie('user-123', {
          movieId: 2,
          rating: 4,
          reviewText: 'Great movie again',
        });
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Movie has already been logged in your watched list');
      }
    });
  });
});

