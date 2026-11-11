import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/http.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return res.status(409).json({ error: `A record with this ${field} already exists` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}
