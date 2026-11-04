import * as movieService from '../services/movie.service.js';
import * as aiService from '../services/ai.service.js';

export const getAll = async (req, res, next) => {
  try {
    const movies = await movieService.getAllMovies(req.query);
    res.status(200).json({
      status: 'success',
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

export const recommend = async (req, res, next) => {
  try {
    const prompt = req.body.prompt || req.body.mood;
    const result = await aiService.getMovieRecommendation(prompt);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getById,
  recommend,
};

