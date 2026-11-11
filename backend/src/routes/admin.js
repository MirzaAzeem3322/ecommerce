import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { badRequest, notFound, serialize } from '../utils/http.js';
import { cancelOrder } from '../services/orders.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const [revenue, orderCount, productCount, userCount, lowStock, recentOrders, byStatus] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.product.findMany({ where: { stock: { lte: 5 } }, orderBy: { stock: 'asc' }, take: 5 }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

  res.json(
    serialize({
      revenue: revenue._sum.total ?? 0,
      orderCount,
      productCount,
      userCount,
      lowStock,
      recentOrders,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    })
  );
});

const ordersQuery = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/orders', validate(ordersQuery, 'query'), async (req, res) => {
  const { status, page, limit } = req.validated;
  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({
    orders: serialize(orders),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

router.patch('/orders/:id/status', validate(statusSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid order id');

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound('Order not found');
  if (order.status === 'CANCELLED') throw badRequest('Cancelled orders cannot be changed');

  const updated =
    req.body.status === 'CANCELLED'
      ? await cancelOrder(id) // puts items back into stock
      : await prisma.order.update({ where: { id }, data: { status: req.body.status } });

  res.json({ order: serialize(updated) });
});

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
  res.json({ users });
});

export default router;
