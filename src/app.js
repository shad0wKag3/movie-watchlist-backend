import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Standard middleware stack
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    name: 'GDGoC Movie Watchlist & Review Platform API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount /api endpoints
app.use('/api', apiRoutes);

// Catch 404 for undefined routes
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export { app };
export default app;

