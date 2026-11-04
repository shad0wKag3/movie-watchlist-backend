import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import { geminiProvider } from '../../src/services/ai.service.js';

describe('Integration - AI Recommendation Endpoint (/api/movies/recommend)', () => {
  const mockMovies = [
    {
      id: 4,
      title: 'Interstellar',
      release_year: 2014,
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
      overview: 'Wormhole space travel to save human survival.',
      rating: 8.7,
      duration: '169 min',
      poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    },
    {
      id: 8,
      title: 'The Matrix',
      release_year: 1999,
      genres: ['Sci-Fi', 'Action'],
      overview: 'Hacker Neo discovers reality is a simulation.',
      rating: 8.7,
      duration: '136 min',
      poster_url: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 200 OK and grounded recommendation with mocked Gemini SDK', async () => {
    jest.spyOn(prisma.movie, 'findMany').mockResolvedValue(mockMovies);

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        movieId: 4,
        reasoning: 'Interstellar fits your mood for an epic, emotional space journey.',
      }),
    });

    jest.spyOn(geminiProvider, 'getClient').mockReturnValue({
      models: {
        generateContent: mockGenerateContent,
      },
    });

    const res = await request(app)
      .post('/api/movies/recommend')
      .send({ prompt: 'I want an emotional, grand adventure across outer space' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.movie).toBeDefined();
    expect(res.body.data.movie.id).toBe(4);
    expect(res.body.data.movie.title).toBe('Interstellar');
    expect(res.body.data.reasoning).toContain('Interstellar fits your mood');
  });

  it('should return 400 Bad Request when prompt or mood is missing', async () => {
    const res = await request(app).post('/api/movies/recommend').send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe('Validation failed');
  });
});
