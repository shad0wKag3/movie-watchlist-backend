import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/appError.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(AppError.unauthorized('Authentication token is required'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(AppError.unauthorized('Invalid authorization header format. Expected "Bearer <token>"'));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(AppError.unauthorized('Invalid token'));
    }
    return next(AppError.unauthorized('Token verification failed'));
  }
};

/**
 * Optional authentication: populates req.user if token is present and valid,
 * but allows unauthenticated requests to proceed.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], env.JWT_SECRET);
      req.user = decoded;
    } catch {
      // Ignore invalid token for optional endpoints
    }
  }

  next();
};

export default authenticateToken;

