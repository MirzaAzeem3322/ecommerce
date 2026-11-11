import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { badRequest, slugify } from '../utils/http.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(60),
});

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json({
    categories: categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products })),
  });
});

router.post('/', requireAuth, requireAdmin, validate(categorySchema), async (req, res) => {
  const category = await prisma.category.create({
    data: { name: req.body.name, slug: slugify(req.body.name) },
  });
  res.status(201).json({ category });
});

router.put('/:id', requireAuth, requireAdmin, validate(categorySchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid category id');
  const category = await prisma.category.update({
    where: { id },
    data: { name: req.body.name, slug: slugify(req.body.name) },
  });
  res.json({ category });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid category id');
  await prisma.category.delete({ where: { id } });
  res.status(204).end();
});

export default router;
