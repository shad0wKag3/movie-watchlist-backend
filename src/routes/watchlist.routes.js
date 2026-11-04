import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  addWatchlistSchema,
  watchlistParamSchema,
} from '../validations/watchlist.validation.js';

const router = Router();

// Protect all watchlist routes with JWT Bearer Token
router.use(authenticateToken);

// 1. GET /api/watchlist - Get user's watchlist
router.get('/', watchlistController.getWatchlist);

// 2. POST /api/watchlist - Add movie to watchlist
router.post('/', validate(addWatchlistSchema, 'body'), watchlistController.addToWatchlist);

// 3. DELETE /api/watchlist/:movieId - Remove movie from watchlist
router.delete(
  '/:movieId',
  validate(watchlistParamSchema, 'params'),
  watchlistController.removeFromWatchlist
);

export default router;

