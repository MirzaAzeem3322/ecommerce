'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUSES } from '@/lib/format';

function OrdersTable() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') || '';
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) q.set('status', status);
    api(`/admin/orders?${q}`)
      .then((d) => {
        setOrders(d.orders);
        setPagination(d.pagination);
      })
      .catch((e) => setError(e.message));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [status]);

  const changeStatus = async (order, newStatus) => {
    if (newStatus === order.status) return;
    if (newStatus === 'CANCELLED' && !window.confirm('Cancel this order? Items will be returned to stock.')) {
      return;
    }
    setError('');
    try {
      await api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status: newStatus } });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) =>
            router.push(e.target.value ? `/admin/orders?status=${e.target.value}` : '/admin/orders')
          }
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {!orders && <p className="text-center text-gray-500">Loading…</p>}
        {orders?.length === 0 && <p className="card p-6 text-center text-gray-500">No orders found.</p>}
        {orders?.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            open={expanded === o.id}
            onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
            onStatus={(s) => changeStatus(o, s)}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!orders && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {orders?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No orders found.</td></tr>
            )}
            {orders?.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                open={expanded === o.id}
                onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
                onStatus={(s) => changeStatus(o, s)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
          <button
            className="btn btn-secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function StatusControl({ order, onStatus }) {
  if (order.status === 'CANCELLED') return <StatusBadge status="CANCELLED" />;
  return (
    <select className="input w-auto py-1" value={order.status} onChange={(e) => onStatus(e.target.value)}>
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
      ))}
    </select>
  );
}

function OrderDetails({ order }) {
  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      <div>
        <p className="mb-2 font-semibold">Items</p>
        <ul className="space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>{i.name} × {i.quantity}</span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 font-semibold">Ship to</p>
        <p>{order.fullName} · {order.phone}</p>
        <p>{order.address}, {order.city} {order.postalCode}, {order.country}</p>
        <Link href={`/orders/${order.id}`} className="mt-2 inline-block text-brand-600 hover:underline">
          Open order page →
        </Link>
      </div>
    </div>
  );
}

function OrderCard({ order, open, onToggle, onStatus }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Order #{order.id}</p>
          <p className="truncate text-sm text-gray-500">{order.user?.name} · {order.user?.email}</p>
          <p className="text-xs text-gray-500">
            {formatDate(order.createdAt)} · {order.paymentMethod === 'COD' ? 'COD' : 'Card'}
          </p>
        </div>
        <span className="shrink-0 font-bold">{formatPrice(order.total)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusControl order={order} onStatus={onStatus} />
        <button onClick={onToggle} className="text-sm font-medium text-brand-600">
          {open ? 'Hide details ▲' : 'Details ▼'}
        </button>
      </div>
      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <OrderDetails order={order} />
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, open, onToggle, onStatus }) {
  return (
    <>
      <tr className="align-top">
        <td className="px-4 py-3">
          <button onClick={onToggle} className="font-medium text-brand-600 hover:underline">
            #{order.id} {open ? '▲' : '▼'}
          </button>
        </td>
        <td className="px-4 py-3">
          <p>{order.user?.name}</p>
          <p className="text-xs text-gray-500">{order.user?.email}</p>
        </td>
        <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
        <td className="px-4 py-3">{order.paymentMethod === 'COD' ? 'COD' : 'Card'}</td>
        <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
        <td className="px-4 py-3">
          {order.status === 'CANCELLED' ? (
            <StatusBadge status="CANCELLED" />
          ) : (
            <select
              className="input w-auto py-1"
              value={order.status}
              onChange={(e) => onStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-semibold">Items</p>
                <ul className="space-y-1">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4">
                      <span>{i.name} × {i.quantity}</span>
                      <span>{formatPrice(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">Ship to</p>
                <p>{order.fullName} · {order.phone}</p>
                <p>{order.address}, {order.city} {order.postalCode}, {order.country}</p>
                <Link href={`/orders/${order.id}`} className="mt-2 inline-block text-brand-600 hover:underline">
                  Open order page →
                </Link>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
      <OrdersTable />
    </Suspense>
  );
}
