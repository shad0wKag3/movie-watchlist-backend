import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';

describe('Integration - Movies Endpoints (/api/movies)', () => {
  const mockMovies = [
    {
      id: 1,
      title: 'Inception',
      overview: 'Dream within a dream',
      release_year: 2010,
      genres: ['Sci-Fi', 'Action'],
      poster_url: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      rating: 8.8,
      duration: '148 min',
    },
    {
      id: 2,
      title: 'Parasite',
      overview: 'Class clash thriller',
      release_year: 2019,
      genres: ['Drama', 'Thriller'],
      poster_url: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      rating: 8.5,
      duration: '132 min',
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/movies', () => {
    it('should return 200 OK and list of all movies', async () => {
      jest.spyOn(prisma.movie, 'findMany').mockResolvedValue(mockMovies);

      const res = await request(app).get('/api/movies');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    it('should support search and shuffle query parameters', async () => {
      jest.spyOn(prisma.movie, 'findMany').mockResolvedValue([mockMovies[0]]);

      const res = await request(app).get('/api/movies?search=inception&shuffle=true');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].title).toBe('Inception');
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return 200 OK and single movie if found', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovies[0]);

      const res = await request(app).get('/api/movies/1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(1);
    });

    it('should return 404 Not Found if movie does not exist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null);

      const res = await request(app).get('/api/movies/999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
    });

    it('should return 400 Bad Request if ID is non-numeric', async () => {
      const res = await request(app).get('/api/movies/abc');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });
});

