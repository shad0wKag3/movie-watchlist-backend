export class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new AppError(401, message);
  }

  static forbidden(message = 'Forbidden access') {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  static conflict(message = 'Conflict: resource already exists') {
    return new AppError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new AppError(500, message);
  }
}

export default AppError;

