import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { stripeEnabled } from '../config.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { badRequest, forbidden, notFound, serialize } from '../utils/http.js';
import { cancelOrder, createOrder, createStripeCheckout } from '../services/orders.js';

const router = Router();
router.use(requireAuth);

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .min(1, 'Your cart is empty'),
  shipping: z.object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    phone: z.string().trim().min(6, 'Phone number is required'),
    address: z.string().trim().min(5, 'Address is required'),
    city: z.string().trim().min(2, 'City is required'),
    postalCode: z.string().trim().min(2, 'Postal code is required'),
    country: z.string().trim().min(2, 'Country is required'),
  }),
  paymentMethod: z.enum(['COD', 'CARD']).default('COD'),
});

router.post('/', validate(orderSchema), async (req, res) => {
  const { items, shipping, paymentMethod } = req.body;

  if (paymentMethod === 'CARD' && !stripeEnabled) {
    throw badRequest('Card payments are not available right now. Please choose Cash on Delivery.');
  }

  const order = await createOrder({ userId: req.user.id, items, shipping, paymentMethod });

  let checkoutUrl = null;
  if (paymentMethod === 'CARD') {
    try {
      checkoutUrl = await createStripeCheckout(order, req.user.email);
    } catch (err) {
      console.error('Stripe checkout failed:', err.message);
      await cancelOrder(order.id);
      throw badRequest('Could not start card payment. Please try again or use Cash on Delivery.');
    }
  }

  res.status(201).json({ order: serialize(order), checkoutUrl });
});

router.get('/mine', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  res.json({ orders: serialize(orders) });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid order id');

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw notFound('Order not found');
  if (order.userId !== req.user.id && req.user.role !== 'ADMIN') throw forbidden();

  res.json({ order: serialize(order) });
});

// Customers can cancel their own order while it is still pending
router.post('/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid order id');

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound('Order not found');
  if (order.userId !== req.user.id) throw forbidden();
  if (order.status !== 'PENDING') throw badRequest('Only pending orders can be cancelled');

  const updated = await cancelOrder(id);
  res.json({ order: serialize(updated) });
});

// Retry card payment for a pending CARD order
router.post('/:id/pay', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid order id');
  if (!stripeEnabled) throw badRequest('Card payments are not available');

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw notFound('Order not found');
  if (order.userId !== req.user.id) throw forbidden();
  if (order.status !== 'PENDING' || order.paymentMethod !== 'CARD') {
    throw badRequest('This order does not need payment');
  }

  const checkoutUrl = await createStripeCheckout(order, req.user.email);
  res.json({ checkoutUrl });
});

export default router;
