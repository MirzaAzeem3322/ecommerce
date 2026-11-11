import { prisma } from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';
import { config } from '../config.js';
import { badRequest } from '../utils/http.js';

export const SHIPPING_FLAT = 5; // flat shipping fee
export const FREE_SHIPPING_OVER = 100; // free shipping when subtotal reaches this

export function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
}

/**
 * Create an order inside a transaction:
 * - prices are read from the database (never trusted from the client)
 * - stock is checked and decremented atomically, so two buyers can't buy the last item
 */
export async function createOrder({ userId, items, shipping, paymentMethod }) {
  // Merge duplicate product lines
  const quantities = new Map();
  for (const { productId, quantity } of items) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  const ids = [...quantities.keys()];

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: ids } } });
    if (products.length !== ids.length) {
      throw badRequest('Some products in your cart no longer exist. Please review your cart.');
    }

    let subtotal = 0;
    const orderItems = [];
    for (const product of products) {
      const quantity = quantities.get(product.id);

      // Decrement only if enough stock remains (atomic check)
      const updated = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (updated.count === 0) {
        throw badRequest(`Not enough stock for "${product.name}". Only ${product.stock} left.`);
      }

      const price = Number(product.price);
      subtotal += price * quantity;
      orderItems.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price,
        quantity,
      });
    }

    const total = Math.round((subtotal + shippingFor(subtotal)) * 100) / 100;

    return tx.order.create({
      data: {
        userId,
        paymentMethod,
        total,
        ...shipping,
        items: { create: orderItems },
      },
      include: { items: true },
    });
  });
}

/** Put the items of an order back into stock (used when an order is cancelled). */
export async function restockOrder(tx, orderId) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}

export async function cancelOrder(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === 'CANCELLED') return order;
    await restockOrder(tx, orderId);
    return tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  });
}

/** Create a Stripe Checkout session for an order and return its URL. */
export async function createStripeCheckout(order, customerEmail) {
  const subtotal = order.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const shippingCost = shippingFor(subtotal);

  const line_items = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: config.currency,
      unit_amount: Math.round(Number(item.price) * 100),
      product_data: {
        name: item.name,
        ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
      },
    },
  }));
  if (shippingCost > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: config.currency,
        unit_amount: Math.round(shippingCost * 100),
        product_data: { name: 'Shipping' },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    metadata: { orderId: String(order.id) },
    success_url: `${config.clientUrl}/orders/${order.id}?payment=success`,
    cancel_url: `${config.clientUrl}/orders/${order.id}?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return session.url;
}
