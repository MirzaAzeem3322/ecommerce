'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUSES } from '@/lib/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats').then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!stats) return <p className="text-gray-500">Loading…</p>;

  const cards = [
    ['Revenue', formatPrice(stats.revenue), 'Paid, shipped and delivered orders'],
    ['Orders', stats.orderCount, 'All time'],
    ['Products', stats.productCount, 'In catalog'],
    ['Customers', stats.userCount, 'Registered accounts'],
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, hint]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-gray-400">{hint}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Orders by status</h2>
        <div className="flex flex-wrap gap-4">
          {ORDER_STATUSES.map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}`} className="flex items-center gap-2">
              <StatusBadge status={s} />
              <span className="font-semibold">{stats.ordersByStatus[s] || 0}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/orders/${o.id}`} className="font-medium hover:text-brand-600">#{o.id}</Link>{' '}
                    <span className="text-gray-500">{o.user?.name} · {formatDate(o.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Low stock (5 or fewer)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-brand-600">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? 'font-semibold text-red-600' : 'text-orange-600'}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
