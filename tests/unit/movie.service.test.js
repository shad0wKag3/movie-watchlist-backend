import { jest } from '@jest/globals';
import { prisma } from '../../src/prisma.js';
import * as movieService from '../../src/services/movie.service.js';
import { AppError } from '../../src/errors/appError.js';

describe('Movie Service - Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllMovies', () => {
    it('should retrieve all movies without filters', async () => {
      const mockMovies = [
        { id: 1, title: 'Inception', release_year: 2010, genres: ['Sci-Fi', 'Action'] },
        { id: 2, title: 'Parasite', release_year: 2019, genres: ['Drama', 'Thriller'] },
      ];

      jest.spyOn(prisma.movie, 'findMany').mockResolvedValue(mockMovies);

      const result = await movieService.getAllMovies();

      expect(prisma.movie.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockMovies);
    });

    it('should filter movies by search query on title or overview', async () => {
      jest.spyOn(prisma.movie, 'findMany').mockResolvedValue([]);

      await movieService.getAllMovies({ search: 'batman' });

      expect(prisma.movie.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'batman', mode: 'insensitive' } },
            { overview: { contains: 'batman', mode: 'insensitive' } },
          ],
        },
        orderBy: { id: 'asc' },
      });
    });

    it('should shuffle movie array when shuffle=true', async () => {
      const mockMovies = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
      }));

      jest.spyOn(prisma.movie, 'findMany').mockResolvedValue([...mockMovies]);

      const result = await movieService.getAllMovies({ shuffle: true });

      expect(result).toHaveLength(10);
      expect(result.map((m) => m.id).sort((a, b) => a - b)).toEqual(
        mockMovies.map((m) => m.id)
      );
    });
  });

  describe('getMovieById', () => {
    it('should return movie if found', async () => {
      const mockMovie = {
        id: 1,
        title: 'Inception',
        overview: 'Dream thief',
        release_year: 2010,
        genres: ['Sci-Fi'],
      };

      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovie);

      const result = await movieService.getMovieById(1);

      expect(prisma.movie.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockMovie);
    });

    it('should throw 404 Not Found if movie does not exist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null);

      await expect(movieService.getMovieById(999)).rejects.toThrow(AppError);

      try {
        await movieService.getMovieById(999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toContain('Movie with ID 999 not found');
      }
    });
  });
});

