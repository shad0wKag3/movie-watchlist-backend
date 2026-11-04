import { AppError } from '../errors/appError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Handle Prisma Known Request Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = err.meta?.target ? ` on field: ${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target}` : '';
        message = `Duplicate entry: a record with this value already exists${target}`;
        errors = err.meta || null;
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = err.meta?.cause || 'Record to update/delete not found';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint violated';
        break;
      }
      default:
        if (err.name === 'PrismaClientKnownRequestError') {
          statusCode = 400;
          message = `Database request error: ${err.message}`;
        }
        break;
    }
  }

  // Handle SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Handle JWT verification errors if passed to next()
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  const response = {
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    statusCode,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (statusCode === 500 && env.NODE_ENV !== 'test') {
    console.error('Unhandled Application Error:', err);
  }

  res.status(statusCode).json(response);
};

export default errorHandler;

