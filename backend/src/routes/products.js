import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { badRequest, notFound, serialize, slugify } from '../utils/http.js';

const router = Router();

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(), // category slug
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(120),
  description: z.string().trim().max(5000).default(''),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().trim().url('Image must be a valid URL').or(z.literal('')).default(''),
  featured: z.boolean().default(false),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});

const sortMap = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  name: { name: 'asc' },
};

router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  const { search, category, featured, sort, page, limit } = req.validated;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { slug: category };
  if (featured) where.featured = featured === 'true';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortMap[sort],
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: serialize(products),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// Accepts either a slug ("blue-shirt") or a numeric id ("12")
router.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const where = /^\d+$/.test(idOrSlug) ? { id: Number(idOrSlug) } : { slug: idOrSlug };

  const product = await prisma.product.findUnique({ where, include: { category: true } });
  if (!product) throw notFound('Product not found');

  const related = product.categoryId
    ? await prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: product.id } },
        take: 4,
        orderBy: { createdAt: 'desc' },
      })
    : [];

  res.json({ product: serialize(product), related: serialize(related) });
});

async function uniqueSlug(name, ignoreId) {
  const base = slugify(name) || 'product';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await prisma.product.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

router.post('/', requireAuth, requireAdmin, validate(productSchema), async (req, res) => {
  const data = req.body;
  const product = await prisma.product.create({
    data: { ...data, categoryId: data.categoryId ?? null, slug: await uniqueSlug(data.name) },
    include: { category: true },
  });
  res.status(201).json({ product: serialize(product) });
});

router.put('/:id', requireAuth, requireAdmin, validate(productSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid product id');
  const data = req.body;
  const product = await prisma.product.update({
    where: { id },
    data: { ...data, categoryId: data.categoryId ?? null, slug: await uniqueSlug(data.name, id) },
    include: { category: true },
  });
  res.json({ product: serialize(product) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid product id');
  await prisma.product.delete({ where: { id } });
  res.status(204).end();
});

export default router;
