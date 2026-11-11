import { badRequest } from '../utils/http.js';

/**
 * Validate req.body (or another part of the request) with a zod schema.
 * The parsed value replaces the original so handlers get clean, typed data.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    throw badRequest(details[0]?.message || 'Invalid input', details);
  }
  if (source === 'body') req.body = result.data;
  else req.validated = result.data;
  next();
};
