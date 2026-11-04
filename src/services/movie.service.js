import { prisma } from '../prisma.js';
import { AppError } from '../errors/appError.js';

export const getAllMovies = async ({ search, shuffle, genre } = {}) => {
  const where = {};

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { overview: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (genre && genre.trim() !== '') {
    where.genres = {
      has: genre.trim(),
    };
  }

  let movies = await prisma.movie.findMany({
    where,
    orderBy: { id: 'asc' },
  });

  if (shuffle) {
    // Fisher-Yates array shuffle for uniform randomization
    const shuffled = [...movies];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    movies = shuffled;
  }

  return movies;
};

export const getMovieById = async (id) => {
  const movieId = Number(id);
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    throw AppError.notFound(`Movie with ID ${movieId} not found`);
  }

  return movie;
};

export default {
  getAllMovies,
  getMovieById,
};

