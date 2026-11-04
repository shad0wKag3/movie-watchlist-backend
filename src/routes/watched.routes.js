import { Router } from 'express';
import * as watchedController from '../controllers/watched.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addWatchedSchema } from '../validations/watched.validation.js';

const router = Router();

// Protect all watched routes with JWT Bearer Token
router.use(authenticateToken);

// 1. GET /api/watched - Get user's viewing history
router.get('/', watchedController.getWatched);

// 2. POST /api/watched - Log movie as watched with 1-5 rating & review
router.post('/', validate(addWatchedSchema, 'body'), watchedController.addWatched);

export default router;

