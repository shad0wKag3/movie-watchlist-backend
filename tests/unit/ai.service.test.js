import { jest } from '@jest/globals';
import { prisma } from '../../src/prisma.js';
import { geminiProvider, getMovieRecommendation } from '../../src/services/ai.service.js';
import { AppError } from '../../src/errors/appError.js';

describe('AI Recommendation Service - Unit Tests', () => {
  const mockCandidates = [
    {
      id: 1,
      title: 'Inception',
      genres: ['Sci-Fi', 'Action'],
      release_year: 2010,
      overview: 'Dream thief heist',
      rating: 8.8,
    },
    {
      id: 2,
      title: 'Parasite',
      genres: ['Drama', 'Thriller'],
      release_year: 2019,
      overview: 'Class struggle and dark comedy',
      rating: 8.5,
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw 400 Bad Request if prompt is empty', async () => {
    await expect(getMovieRecommendation('')).rejects.toThrow(AppError);
    try {
      await getMovieRecommendation('   ');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('should throw 404 Not Found if candidate database is empty', async () => {
    jest.spyOn(prisma.movie, 'findMany').mockResolvedValue([]);

    await expect(getMovieRecommendation('I want a mind-bending sci-fi')).rejects.toThrow(
      AppError
    );

    try {
      await getMovieRecommendation('I want a mind-bending sci-fi');
    } catch (err) {
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('No candidate movies found in database');
    }
  });

  it('should successfully get recommendation grounded on candidates via Gemini SDK', async () => {
    jest.spyOn(prisma.movie, 'findMany').mockResolvedValue(mockCandidates);

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        movieId: 1,
        reasoning: 'Inception perfectly matches your desire for mind-bending sci-fi with multi-layered dreams.',
      }),
    });

    jest.spyOn(geminiProvider, 'getClient').mockReturnValue({
      models: {
        generateContent: mockGenerateContent,
      },
    });

    const result = await getMovieRecommendation('mind-bending sci-fi dream story');

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.model).toBe('gemini-2.5-flash');
    expect(callArgs.config.temperature).toBe(0.3);
    expect(callArgs.config.responseMimeType).toBe('application/json');
    expect(callArgs.config.systemInstruction).toContain('Inception');
    expect(callArgs.config.systemInstruction).toContain('Parasite');

    expect(result.movie.id).toBe(1);
    expect(result.movie.title).toBe('Inception');
    expect(result.reasoning).toContain('Inception perfectly matches');
  });

  it('should defensively fallback to candidate movie if Gemini returns out-of-catalog ID', async () => {
    jest.spyOn(prisma.movie, 'findMany').mockResolvedValue(mockCandidates);

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        movieId: 9999, // Non-existent movie ID!
        reasoning: 'AI hallucinated an external movie ID.',
      }),
    });

    jest.spyOn(geminiProvider, 'getClient').mockReturnValue({
      models: {
        generateContent: mockGenerateContent,
      },
    });

    const result = await getMovieRecommendation('something funny');

    // Defensive fallback must pick an available movie from the candidate catalog
    expect(result.movie.id).toBe(1);
    expect(result.movie).toEqual(mockCandidates[0]);
    expect(result.reasoning).toBeTruthy();
  });
});
