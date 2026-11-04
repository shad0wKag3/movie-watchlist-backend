import { prisma } from '../prisma.js';
import { AppError } from '../errors/appError.js';

// Format item watched agar memiliki properti `review` & `opinion` sesuai kebutuhan frontend (app.js)
const formatWatchedItem = (item) => {
  if (!item) return item;
  
  const textContent = item.review_text || item.reviewText || item.review || item.opinion || item.comment || '';

  return {
    ...item,
    review_text: textContent,
    reviewText: textContent,
    review: textContent,
    opinion: textContent,
  };
};

export const getWatchedHistory = async (userId) => {
  const items = await prisma.watched.findMany({
    where: { user_id: userId },
    include: {
      movie: true,
    },
    orderBy: { watched_at: 'desc' },
  });

  return items.map(formatWatchedItem);
};

export const addWatchedMovie = async (userId, body) => {
  const { movieId, rating } = body;
  const numericMovieId = Number(movieId);

  const rawReviewText = body.reviewText ?? body.review_text ?? body.review ?? body.opinion ?? body.comment ?? '';

  if (!rawReviewText || typeof rawReviewText !== 'string' || rawReviewText.trim() === '') {
    throw AppError.badRequest('reviewText or review_text is required');
  }

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
        review_text: rawReviewText.trim(),
      },
      include: {
        movie: true,
      },
    });

    return formatWatchedItem(entry);
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