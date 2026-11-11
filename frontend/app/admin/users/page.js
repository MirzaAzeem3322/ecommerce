'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>
      {error && <div className="alert-error">{error}</div>}
      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {!users && !error && <p className="text-center text-gray-500">Loading…</p>}
        {users?.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-sm text-gray-500">{u.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  u.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {u.role}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {u._count.orders} orders · Joined {formatDate(u.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!users && !error && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u._count.orders}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
