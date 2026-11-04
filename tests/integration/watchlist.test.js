import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import { env } from '../../src/config/env.js';

describe('Integration - Watchlist Endpoints (/api/watchlist)', () => {
  const userId = 'user-test-uuid';
  const validToken = jwt.sign(
    { id: userId, email: 'test@gdgoc.dev', name: 'Tester' },
    env.JWT_SECRET
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should return 401 Unauthorized when Bearer token is missing', async () => {
      const res = await request(app).get('/api/watchlist');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Authentication token is required');
    });
  });

  describe('POST /api/watchlist', () => {
    it('should return 201 Created when adding a valid movie to watchlist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({
        id: 1,
        title: 'Inception',
      });
      jest.spyOn(prisma.watchlist, 'create').mockResolvedValue({
        id: 'wl-item-1',
        user_id: userId,
        movie_id: 1,
        created_at: new Date(),
        movie: {
          id: 1,
          title: 'Inception',
          overview: 'Dream extraction',
          release_year: 2010,
        },
      });

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ movieId: 1 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Movie added to watchlist');
      expect(res.body.data.movie_id).toBe(1);
    });

    it('should return 409 Conflict when adding duplicate movie to watchlist (P2002)', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({
        id: 1,
        title: 'Inception',
      });

      const p2002Error = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      jest.spyOn(prisma.watchlist, 'create').mockRejectedValue(p2002Error);

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ movieId: 1 });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Movie is already in your watchlist');
    });
  });

  describe('GET /api/watchlist', () => {
    it('should return 200 OK and user watchlist', async () => {
      const mockWatchlist = [
        {
          id: 'wl-1',
          user_id: userId,
          movie_id: 1,
          movie: { id: 1, title: 'Inception' },
        },
        {
          id: 'wl-2',
          user_id: userId,
          movie_id: 2,
          movie: { id: 2, title: 'Parasite' },
        },
      ];

      jest.spyOn(prisma.watchlist, 'findMany').mockResolvedValue(mockWatchlist);

      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /api/watchlist/:movieId', () => {
    it('should return 200 OK when removing movie from watchlist', async () => {
      jest.spyOn(prisma.watchlist, 'findUnique').mockResolvedValue({
        id: 'wl-1',
        user_id: userId,
        movie_id: 1,
      });
      jest.spyOn(prisma.watchlist, 'delete').mockResolvedValue({});

      const res = await request(app)
        .delete('/api/watchlist/1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Movie removed from watchlist');
    });
  });
});

