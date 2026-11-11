'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';

function OrdersList() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders/mine')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">My orders</h1>
      {error && <div className="alert-error">{error}</div>}
      {!orders && !error && <p className="text-gray-500">Loading…</p>}
      {orders?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="mb-4 text-gray-500">You haven’t placed any orders yet.</p>
          <Link href="/products" className="btn btn-primary">Start shopping</Link>
        </div>
      )}
      {orders?.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-brand-500"
            >
              <div>
                <p className="font-semibold">Order #{o.id}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items ·{' '}
                  {o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} />
                <span className="font-bold">{formatPrice(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}
