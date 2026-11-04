import { prisma } from '../prisma.js';
import { AppError } from '../errors/appError.js';

export const getWatchlist = async (userId) => {
  const items = await prisma.watchlist.findMany({
    where: { user_id: userId },
    include: {
      movie: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return items;
};

export const addToWatchlist = async (userId, movieId) => {
  const numericMovieId = Number(movieId);

  // Check if the movie exists first
  const movie = await prisma.movie.findUnique({
    where: { id: numericMovieId },
  });

  if (!movie) {
    throw AppError.notFound(`Movie with ID ${numericMovieId} not found`);
  }

  try {
    const entry = await prisma.watchlist.create({
      data: {
        user_id: userId,
        movie_id: numericMovieId,
      },
      include: {
        movie: true,
      },
    });

    return entry;
  } catch (error) {
    // Specifically handle duplicate unique constraint P2002
    if (error.code === 'P2002') {
      throw AppError.conflict('Movie is already in your watchlist');
    }
    throw error;
  }
};

export const removeFromWatchlist = async (userId, movieId) => {
  const numericMovieId = Number(movieId);

  // Check if entry exists in watchlist
  const existing = await prisma.watchlist.findUnique({
    where: {
      user_id_movie_id: {
        user_id: userId,
        movie_id: numericMovieId,
      },
    },
  });

  if (!existing) {
    throw AppError.notFound('Movie is not in your watchlist');
  }

  await prisma.watchlist.delete({
    where: {
      user_id_movie_id: {
        user_id: userId,
        movie_id: numericMovieId,
      },
    },
  });

  return { message: 'Movie removed from watchlist' };
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};

