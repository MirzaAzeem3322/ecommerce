'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';

function OrderDetail() {
  const { id } = useParams();
  const params = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // After returning from Stripe, the webhook may take a moment — refresh a few times
  useEffect(() => {
    if (params.get('payment') !== 'success' || order?.status !== 'PENDING') return;
    const t = setTimeout(load, 2500);
    return () => clearTimeout(t);
  }, [params, order, load]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true);
    try {
      const d = await api(`/orders/${id}/cancel`, { method: 'POST' });
      setOrder((o) => ({ ...o, ...d.order, items: o.items }));
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const pay = async () => {
    setBusy(true);
    try {
      const d = await api(`/orders/${id}/pay`, { method: 'POST' });
      window.location.href = d.checkoutUrl;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (error && !order) {
    return (
      <div className="container-page py-10">
        <div className="alert-error">{error}</div>
      </div>
    );
  }
  if (!order) return <div className="container-page py-20 text-center text-gray-500">Loading…</div>;

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = Math.max(0, Math.round((order.total - subtotal) * 100) / 100);
  const isOwner = order.userId === user?.id;

  return (
    <div className="container-page max-w-4xl py-10">
      {params.get('placed') && (
        <div className="alert-success mb-6">
          Thank you! Your order has been placed. We’ll contact you when it ships.
        </div>
      )}
      {params.get('payment') === 'success' && (
        <div className="alert-success mb-6">
          Payment received — thank you! {order.status === 'PENDING' && 'Confirming your payment…'}
        </div>
      )}
      {params.get('payment') === 'cancelled' && order.status === 'PENDING' && (
        <div className="alert-error mb-6">Payment was cancelled. You can try again below.</div>
      )}
      {error && <div className="alert-error mb-6">{error}</div>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>
          <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="card divide-y divide-gray-200">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="space-y-1 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-semibold">Shipping to</h2>
            <p>{order.fullName}</p>
            <p>{order.address}</p>
            <p>{order.city}, {order.postalCode}</p>
            <p>{order.country}</p>
            <p className="mt-2 text-gray-500">{order.phone}</p>
          </div>
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card (Stripe)'}</p>
          </div>

          {isOwner && order.status === 'PENDING' && (
            <div className="space-y-2">
              {order.paymentMethod === 'CARD' && (
                <button onClick={pay} disabled={busy} className="btn btn-primary w-full">
                  Pay now
                </button>
              )}
              <button onClick={cancel} disabled={busy} className="btn btn-secondary w-full text-red-600">
                Cancel order
              </button>
            </div>
          )}
          <Link href="/orders" className="block text-center text-sm text-gray-500 hover:text-gray-800">
            ← Back to my orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <OrderDetail />
      </Suspense>
    </RequireAuth>
  );
}
