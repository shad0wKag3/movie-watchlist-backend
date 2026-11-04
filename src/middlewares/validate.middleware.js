import { ZodError } from 'zod';
import { AppError } from '../errors/appError.js';

/**
 * Middleware factory to validate request parts (body, query, params) against Zod schemas.
 * On failure, returns a 400 response with detailed error messages concatenated into message string.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = await schema.parseAsync(dataToValidate);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Deduplicate errors per field — keep the first message per path to avoid repetition
        const seen = new Set();
        const errors = [];
        for (const err of error.errors) {
          const field = err.path.join('.') || 'unknown';
          if (!seen.has(field)) {
            seen.add(field);
            errors.push({ field, message: err.message });
          }
        }

        // Combine all specific error messages into a single main message string for the Frontend
        const detailedMessage = errors.map((e) => e.message).join('. ');

        return next(new AppError(400, detailedMessage || 'Validation failed', errors));
      }
      next(error);
    }
  };
};

export default validate;