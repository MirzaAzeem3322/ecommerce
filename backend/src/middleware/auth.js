import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired, please log in again');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw unauthorized();

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') throw forbidden();
  next();
}
