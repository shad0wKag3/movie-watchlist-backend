import { app } from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(` GDGoC Movie Watchlist Server listening on port ${PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;

