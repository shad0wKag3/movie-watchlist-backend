import { prisma } from '../prisma.js';
import { AppError } from '../errors/appError.js';

export const getWatchedHistory = async (userId) => {
  const items = await prisma.watched.findMany({
    where: { user_id: userId },
    include: {
      movie: true,
    },
    orderBy: { watched_at: 'desc' },
  });

  return items;
};

export const addWatchedMovie = async (userId, { movieId, rating, reviewText }) => {
  const numericMovieId = Number(movieId);

  // Verify movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: numericMovieId },
  });

  if (!movie) {
    throw AppError.notFound(`Movie with ID ${numericMovieId} not found`);
  }

  try {
    const entry = await prisma.watched.create({
      data: {
        user_id: userId,
        movie_id: numericMovieId,
        rating: Number(rating),
        review_text: reviewText.trim(),
      },
      include: {
        movie: true,
      },
    });

    return entry;
  } catch (error) {
    if (error.code === 'P2002') {
      throw AppError.conflict('Movie has already been logged in your watched list');
    }
    throw error;
  }
};

export default {
  getWatchedHistory,
  addWatchedMovie,
};

