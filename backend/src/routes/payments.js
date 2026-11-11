import express, { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';
import { config, stripeEnabled } from '../config.js';
import { cancelOrder } from '../services/orders.js';

const router = Router();

router.get('/config', (req, res) => {
  res.json({ cardPayments: stripeEnabled, currency: config.currency });
});

/**
 * Stripe webhook. Stripe needs the raw request body to verify the signature,
 * so this route is mounted BEFORE express.json() in app.js.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(400).send('Stripe is not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      config.stripeWebhookSecret
    );
  } catch (err) {
    console.error('Webhook signature check failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  const orderId = Number(session?.metadata?.orderId);

  if (orderId) {
    if (event.type === 'checkout.session.completed' && session.payment_status === 'paid') {
      await prisma.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID' },
      });
    } else if (event.type === 'checkout.session.expired') {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      // Only cancel if this was the latest session for the order and it's still unpaid
      if (order && order.status === 'PENDING' && order.stripeSessionId === session.id) {
        await cancelOrder(orderId);
      }
    }
  }

  res.json({ received: true });
});

export default router;
