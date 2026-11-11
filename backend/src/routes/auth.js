import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError, unauthorized } from '../utils/http.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10) },
  });

  res.status(201).json({ user: publicUser(user), token: signToken(user) });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized('Incorrect email or password');
  }

  res.json({ user: publicUser(user), token: signToken(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
