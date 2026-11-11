export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'ShopNext';
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'USD';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY });

export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// Must match backend/src/services/orders.js
export const SHIPPING_FLAT = 5;
export const FREE_SHIPPING_OVER = 100;
export const shippingFor = (subtotal) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;

export const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
