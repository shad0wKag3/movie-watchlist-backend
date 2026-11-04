import { GoogleGenAI } from '@google/genai';
import { prisma } from '../prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/appError.js';

export const geminiProvider = {
  getClient() {
    if (!env.GEMINI_API_KEY) {
      throw AppError.internal('Google Gemini API key is not configured');
    }
    return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  },
};

const isServerOverloadedError = (err) => {
  const errMsg = err?.message || '';
  const errStatus = err?.status || err?.statusCode || 0;
  return errStatus === 503 || errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
};

export const getMovieRecommendation = async (userPrompt) => {
  if (!userPrompt || userPrompt.trim() === '') {
    throw AppError.badRequest('A prompt or mood description is required for recommendations');
  }

  // 1. Fetch candidate movies from database
  const candidateMovies = await prisma.movie.findMany({
    orderBy: { id: 'asc' },
  });

  if (!candidateMovies || candidateMovies.length === 0) {
    throw AppError.notFound('No candidate movies found in database. Please seed the database first.');
  }

  const catalogRepresentation = candidateMovies.map((m) => ({
    id: m.id,
    title: m.title,
    genres: m.genres,
    release_year: m.release_year,
    overview: m.overview,
    rating: m.rating,
  }));

  // 2. Build System Instruction for In-Context Grounding
  const systemInstruction = `
You are an expert movie recommendation engine for GDGoC Movie Watchlist platform.
You will be given a user's mood, preference, or description, along with the strict candidate catalog of movies available in the database.

STRICT INSTRUCTIONS:
1. You MUST choose ONLY ONE movie from the candidate catalog provided below.
2. Under no circumstance may you recommend any movie that is not in this candidate catalog.
3. Select the candidate whose genres, theme, overview, or tone best matches the user's mood/prompt.
4. Return your output STRICTLY as a valid JSON object with exactly two keys:
   - "movieId": integer (the ID of the selected movie from the catalog)
   - "reasoning": string (a concise explanation of why this movie matches the user's mood/prompt)

CANDIDATE CATALOG:
${JSON.stringify(catalogRepresentation, null, 2)}
`.trim();

  // 3. Call Gemini API using gemini-3.8-flash
  let parsedRecommendation;
  try {
    const ai = geminiProvider.getClient();

    // Gunakan gemini-3.8-flash sebagai model utama sesuai arahan API
    const modelsToTry = [
      env.GEMINI_MODEL,
      'gemini-3.8-flash',
    ].filter(Boolean);

    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: `User mood/preference: "${userPrompt.trim()}". Recommend the single best movie from the candidate catalog.`,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });
        if (response) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed: ${err.message}. Trying next model...`);
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini models failed to respond');
    }

    const rawText =
      typeof response.text === 'function'
        ? response.text()
        : response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const sanitizedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsedRecommendation = JSON.parse(sanitizedJson);
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Gemini API recommendation error:', err);

    if (isServerOverloadedError(err)) {
      throw new AppError(503, 'AI recommendation service is currently experiencing high demand. Please try again in a few seconds.');
    }

    throw AppError.internal(`AI recommendation failed: ${err.message}`);
  }

  // 4. Defensive matching against catalog
  const targetId = Number(parsedRecommendation?.movieId || parsedRecommendation?.id || parsedRecommendation?.movie_id);
  let matchedMovie = candidateMovies.find((m) => m.id === targetId);
  let reasoning = parsedRecommendation?.reasoning;

  if (!matchedMovie) {
    matchedMovie = candidateMovies[0];
    reasoning = reasoning || `Recommended movie based on your request: "${userPrompt.trim()}".`;
  }

  if (!reasoning || typeof reasoning !== 'string' || reasoning.trim() === '') {
    reasoning = `Selected "${matchedMovie.title}" as the best match for your request.`;
  }

  return {
    movie: matchedMovie,
    reasoning: reasoning.trim(),
  };
};

export default {
  geminiProvider,
  getMovieRecommendation,
};