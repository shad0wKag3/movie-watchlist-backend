export const addWatchedMovie = async (userId, body) => {
  const { movieId, rating } = body;
  const numericMovieId = Number(movieId);

  // Fallback untuk mengekstrak teks review dari berbagai nama property yang mungkin dikirim frontend
  const rawReviewText = body.reviewText ?? body.review_text ?? body.review ?? body.comment ?? '';

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

    return entry;
  } catch (error) {
    if (error.code === 'P2002') {
      throw AppError.conflict('Movie has already been logged in your watched list');
    }
    throw error;
  }
};