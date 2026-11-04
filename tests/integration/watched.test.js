import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import { env } from '../../src/config/env.js';

describe('Integration - Watched Endpoints (/api/watched)', () => {
  const userId = 'user-test-uuid';
  const validToken = jwt.sign(
    { id: userId, email: 'test@gdgoc.dev', name: 'Tester' },
    env.JWT_SECRET
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/watched');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/watched', () => {
    it('should return 201 Created when logging movie with rating and review', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue({ id: 1, title: 'Inception' });
      jest.spyOn(prisma.watched, 'create').mockResolvedValue({
        id: 'watched-1',
        user_id: userId,
        movie_id: 1,
        rating: 5,
        review_text: 'Mind bending masterpiece!',
        watched_at: new Date(),
        movie: { id: 1, title: 'Inception' },
      });

      const res = await request(app)
        .post('/api/watched')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          movieId: 1,
          rating: 5,
          reviewText: 'Mind bending masterpiece!',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.rating).toBe(5);
    });

    it('should return 400 Bad Request on invalid rating (> 5)', async () => {
      const res = await request(app)
        .post('/api/watched')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          movieId: 1,
          rating: 6, // invalid
          reviewText: 'Awesome',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/watched', () => {
    it('should return 200 OK and watched history', async () => {
      jest.spyOn(prisma.watched, 'findMany').mockResolvedValue([
        {
          id: 'watched-1',
          user_id: userId,
          movie_id: 1,
          rating: 5,
          review_text: 'Great film',
          movie: { id: 1, title: 'Inception' },
        },
      ]);

      const res = await request(app)
        .get('/api/watched')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
    });
  });
});

