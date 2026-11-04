import { ZodError } from 'zod';
import { AppError } from '../errors/appError.js';

/**
 * Middleware factory to validate request parts (body, query, params) against Zod schemas
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
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new AppError(400, 'Validation failed', errors));
      }
      next(error);
    }
  };
};

export default validate;

