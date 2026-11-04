import { GoogleGenAI } from '@google/genai';
import { prisma } from '../prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/appError.js';

/**
 * Gemini client provider object allowing clean dependency injection & mocking
 */
export const geminiProvider = {
  getClient() {
    if (!env.GEMINI_API_KEY) {
      throw AppError.internal('Google Gemini API key is not configured');
    }
    return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  },
};

/**
 * Recommends a movie based on user mood or preference prompt
 * using Gemini 2.5 Flash and in-context grounding against the local movie catalog.
 *
 * @param {string} userPrompt - User mood or movie description
 * @returns {Promise<{ movie: object, reasoning: string }>}
 */
export const getMovieRecommendation = async (userPrompt) => {
  if (!userPrompt || userPrompt.trim() === '') {
    throw AppError.badRequest('A prompt or mood description is required for recommendations');
  }

  // 1. Fetch all local candidate movies from PostgreSQL via Prisma
  const candidateMovies = await prisma.movie.findMany({
    orderBy: { id: 'asc' },
  });

  if (!candidateMovies || candidateMovies.length === 0) {
    throw AppError.notFound('No candidate movies found in database. Please seed the database first.');
  }

  // Build condensed candidate catalog for in-context grounding
  const catalogRepresentation = candidateMovies.map((m) => ({
    id: m.id,
    title: m.title,
    genres: m.genres,
    release_year: m.release_year,
    overview: m.overview,
    rating: m.rating,
  }));

  // 2. Prepare In-Context Grounding via System Instruction
  const systemInstruction = `
You are an expert movie recommendation engine for GDGoC Movie Watchlist platform.
You will be given a user's mood, preference, or description, along with the strict candidate catalog of movies currently available in the database.

STRICT INSTRUCTIONS:
1. You MUST choose ONLY ONE movie from the candidate catalog provided below.
2. Under no circumstance may you recommend any movie that is not in this candidate catalog.
3. You must select the candidate whose genres, theme, overview, or tone best matches the user's mood/prompt.
4. Return your output STRICTLY as a valid JSON object with exactly two keys:
   - "movieId": integer (the ID of the selected movie from the catalog)
   - "reasoning": string (a concise explanation of why this movie matches the user's mood/prompt)

CANDIDATE CATALOG:
${JSON.stringify(catalogRepresentation, null, 2)}
`.trim();

  // 3. Call Google Gemini API (@google/genai) using model 'gemini-2.5-flash'
  let parsedRecommendation;
  try {
    const ai = geminiProvider.getClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User mood/preference: "${userPrompt.trim()}". Recommend the single best movie from the candidate catalog.`,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const rawText =
      typeof response.text === 'function'
        ? response.text()
        : response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Strip potential markdown code block fences if any
    const sanitizedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsedRecommendation = JSON.parse(sanitizedJson);
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Gemini API recommendation error:', err);
    throw AppError.internal(`AI recommendation failed: ${err.message}`);
  }

  // 4. Defensive cross-checking against local candidate movies
  const targetId = Number(parsedRecommendation?.movieId || parsedRecommendation?.id || parsedRecommendation?.movie_id);
  let matchedMovie = candidateMovies.find((m) => m.id === targetId);
  let reasoning = parsedRecommendation?.reasoning;

  // Defensive fallback if AI returned an invalid or nonexistent ID
  if (!matchedMovie) {
    console.warn(`Defensive fallback: Gemini returned non-catalog ID ${targetId}. Selecting default candidate.`);
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
