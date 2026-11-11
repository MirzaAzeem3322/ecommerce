'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (query) q.set('search', query);
    api(`/products?${q}`)
      .then((d) => {
        setProducts(d.products);
        setPagination(d.pagination);
      })
      .catch((e) => setError(e.message));
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api(`/products/${product.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
        className="flex gap-2"
      >
        <input
          className="input max-w-sm"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary">Search</button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {!products && <p className="text-center text-gray-500">Loading…</p>}
        {products?.length === 0 && <p className="card p-6 text-center text-gray-500">No products found.</p>}
        {products?.map((p) => (
          <div key={p.id} className="card flex gap-3 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-xs text-gray-500">
                {p.category?.name || 'No category'}
                {p.featured && <span className="text-brand-600"> · Featured</span>}
              </p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="font-semibold">{formatPrice(p.price)}</span>
                <span className={p.stock <= 5 ? 'font-semibold text-orange-600' : 'text-gray-600'}>
                  Stock: {p.stock}
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <Link href={`/products/${p.slug}`} className="text-gray-500">View</Link>
                <Link href={`/admin/products/${p.id}`} className="text-brand-600">Edit</Link>
                <button onClick={() => remove(p)} className="text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!products && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {products?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No products found.</td></tr>
            )}
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.featured && <span className="text-xs text-brand-600">Featured</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name || '—'}</td>
                <td className="px-4 py-3">{formatPrice(p.price)}</td>
                <td className={`px-4 py-3 ${p.stock <= 5 ? 'font-semibold text-orange-600' : ''}`}>{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/products/${p.slug}`} className="text-gray-500 hover:underline">View</Link>
                    <Link href={`/admin/products/${p.id}`} className="text-brand-600 hover:underline">Edit</Link>
                    <button onClick={() => remove(p)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
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
