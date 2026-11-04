import { Router } from 'express';
import * as movieController from '../controllers/movie.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import {
  movieQuerySchema,
  movieIdParamSchema,
  recommendSchema,
} from '../validations/movie.validation.js';

const router = Router();

// 1. GET /api/movies - List movies with search & shuffle
router.get('/', validate(movieQuerySchema, 'query'), movieController.getAll);

// 2. POST /api/movies/recommend - AI movie recommendation (MUST precede /:id)
router.post(
  '/recommend',
  optionalAuth,
  validate(recommendSchema, 'body'),
  movieController.recommend
);

// 3. GET /api/movies/:id - Get single movie by ID
router.get('/:id', validate(movieIdParamSchema, 'params'), movieController.getById);

export default router;

