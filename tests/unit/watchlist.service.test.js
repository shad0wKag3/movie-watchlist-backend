import { jest } from '@jest/globals';
import { prisma } from '../../src/prisma.js';
import * as watchlistService from '../../src/services/watchlist.service.js';
import { AppError } from '../../src/errors/appError.js';

describe('Watchlist Service - Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWatchlist', () => {
    it('should return user watchlist items', async () => {
      const mockItems = [
        {
          id: 'watch-1',
          user_id: 'user-123',
          movie_id: 1,
          movie: { id: 1, title: 'Inception' },
        },
      ];

      jest.spyOn(prisma.watchlist, 'findMany').mockResolvedValue(mockItems);

      const result = await watchlistService.getWatchlist('user-123');

      expect(prisma.watchlist.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        include: { movie: true },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('addToWatchlist', () => {
    it('should add movie to watchlist successfully', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({ id: 1, title: 'Inception' });
      jest.spyOn(prisma.watchlist, 'create').mockResolvedValue({
        id: 'watch-new',
        user_id: 'user-123',
        movie_id: 1,
        movie: { id: 1, title: 'Inception' },
      });

      const result = await watchlistService.addToWatchlist('user-123', 1);

      expect(prisma.movie.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.watchlist.create).toHaveBeenCalledWith({
        data: { user_id: 'user-123', movie_id: 1 },
        include: { movie: true },
      });
      expect(result.id).toBe('watch-new');
    });

    it('should throw 404 if movie does not exist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null);

      await expect(watchlistService.addToWatchlist('user-123', 999)).rejects.toThrow(AppError);

      try {
        await watchlistService.addToWatchlist('user-123', 999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toContain('Movie with ID 999 not found');
      }
    });

    it('should throw 409 Conflict when duplicate entry P2002 occurs', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({ id: 1, title: 'Inception' });

      const prismaError = new Error('Unique constraint failed');
      prismaError.code = 'P2002';
      jest.spyOn(prisma.watchlist, 'create').mockRejectedValue(prismaError);

      await expect(watchlistService.addToWatchlist('user-123', 1)).rejects.toThrow(AppError);

      try {
        await watchlistService.addToWatchlist('user-123', 1);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Movie is already in your watchlist');
      }
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove movie from watchlist', async () => {
      jest.spyOn(prisma.watchlist, 'findUnique').mockResolvedValue({
        id: 'watch-1',
        user_id: 'user-123',
        movie_id: 1,
      });
      jest.spyOn(prisma.watchlist, 'delete').mockResolvedValue({});

      const result = await watchlistService.removeFromWatchlist('user-123', 1);

      expect(prisma.watchlist.delete).toHaveBeenCalledWith({
        where: {
          user_id_movie_id: {
            user_id: 'user-123',
            movie_id: 1,
          },
        },
      });
      expect(result.message).toBe('Movie removed from watchlist');
    });

    it('should throw 404 if movie is not in watchlist', async () => {
      jest.spyOn(prisma.watchlist, 'findUnique').mockResolvedValue(null);

      await expect(watchlistService.removeFromWatchlist('user-123', 999)).rejects.toThrow(AppError);

      try {
        await watchlistService.removeFromWatchlist('user-123', 999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Movie is not in your watchlist');
      }
    });
  });
});

