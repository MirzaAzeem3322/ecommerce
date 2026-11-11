import { Prisma } from '@prisma/client';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Please log in') => new HttpError(401, msg);
export const forbidden = (msg = 'You do not have permission to do that') => new HttpError(403, msg);
export const notFound = (msg = 'Not found') => new HttpError(404, msg);

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Convert Prisma Decimal fields to plain numbers so the frontend gets JSON numbers. */
export function serialize(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(serialize);
  if (data instanceof Date) return data;
  if (typeof data === 'object') {
    if (Prisma.Decimal.isDecimal(data)) return Number(data);
    const out = {};
    for (const [key, value] of Object.entries(data)) out[key] = serialize(value);
    return out;
  }
  return data;
}
