'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { formatPrice, shippingFor } from '@/lib/format';

const fields = [
  ['fullName', 'Full name', 'text', 'sm:col-span-2'],
  ['phone', 'Phone number', 'tel', ''],
  ['country', 'Country', 'text', ''],
  ['address', 'Street address', 'text', 'sm:col-span-2'],
  ['city', 'City', 'text', ''],
  ['postalCode', 'Postal code', 'text', ''],
];

function CheckoutForm() {
  const { user } = useAuth();
  const { items, ready, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [cardEnabled, setCardEnabled] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    api('/payments/config')
      .then((c) => setCardEnabled(c.cardPayments))
      .catch(() => setCardEnabled(false));
  }, []);

  if (!ready) return null;
  if (placed) {
    return <div className="container-page py-24 text-center text-gray-500">Redirecting…</div>;
  }
  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="mb-4 text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  const shippingCost = shippingFor(subtotal);

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { order, checkoutUrl } = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shipping,
          paymentMethod,
        },
      });
      setPlaced(true);
      clearCart();
      if (checkoutUrl) {
        window.location.href = checkoutUrl; // go to Stripe
      } else {
        router.push(`/orders/${order.id}?placed=1`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Shipping details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([name, label, type, span]) => (
                <div key={name} className={span}>
                  <label className="label" htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    type={type}
                    required
                    className="input"
                    value={shipping[name]}
                    onChange={(e) => setShipping((s) => ({ ...s, [name]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment method</h2>
            <div className="space-y-3">
              <PaymentOption
                value="COD"
                current={paymentMethod}
                onChange={setPaymentMethod}
                title="Cash on Delivery"
                text="Pay in cash when your order arrives."
              />
              <PaymentOption
                value="CARD"
                current={paymentMethod}
                onChange={setPaymentMethod}
                title="Credit / Debit card"
                text={cardEnabled ? 'Pay securely with Stripe.' : 'Not available right now.'}
                disabled={!cardEnabled}
              />
            </div>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 text-sm">
                <span>
                  {i.name} <span className="text-gray-500">× {i.quantity}</span>
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal + shippingCost)}</span>
          </div>
          {error && <div className="alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary w-full py-3" disabled={submitting}>
            {submitting ? 'Placing order…' : paymentMethod === 'CARD' ? 'Continue to payment' : 'Place order'}
          </button>
        </aside>
      </form>
    </div>
  );
}

function PaymentOption({ value, current, onChange, title, text, disabled }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
        current === value ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="mt-1"
      />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-sm text-gray-500">{text}</span>
      </span>
    </label>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}
