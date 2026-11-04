import { Router } from 'express';
import authRoutes from './auth.routes.js';
import movieRoutes from './movie.routes.js';
import watchlistRoutes from './watchlist.routes.js';
import watchedRoutes from './watched.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'GDGoC Movie Watchlist API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Mount resource routes
router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/watched', watchedRoutes);

export default router;

