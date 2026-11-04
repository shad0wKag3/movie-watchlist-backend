import { AppError } from '../errors/appError.js';

export const notFound = (req, res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export default notFound;

