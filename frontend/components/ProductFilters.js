'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductFilters({ categories }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSearch(params.get('search') || '');
  }, [params]);

  const update = (changes) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page'); // reset to first page when filters change
    setOpen(false); // close the panel on phones after choosing
    router.push(`${pathname}?${next.toString()}`);
  };

  const activeCategory = params.get('category') || '';
  const activeCount = ['search', 'category', 'sort'].filter((k) => params.get(k)).length;

  return (
    <aside>
      {/* Phone: filters are hidden behind a button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-secondary w-full justify-between md:hidden"
        aria-expanded={open}
      >
        <span>
          Filters &amp; sort
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{activeCount}</span>
          )}
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      <div className={`${open ? 'mt-4 block' : 'hidden'} card space-y-6 p-4 md:mt-0 md:block md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ search: search.trim() });
        }}
      >
        <label className="label" htmlFor="search">Search</label>
        <input
          id="search"
          className="input"
          placeholder="Product name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div>
        <p className="label">Category</p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => update({ category: '' })}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                !activeCategory ? 'bg-brand-50 font-medium text-brand-700' : 'hover:bg-gray-100'
              }`}
            >
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => update({ category: c.slug })}
                className={`flex w-full justify-between rounded-lg px-3 py-1.5 text-left text-sm ${
                  activeCategory === c.slug
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-gray-400">{c.productCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="label" htmlFor="sort">Sort by</label>
        <select
          id="sort"
          className="input"
          value={params.get('sort') || 'newest'}
          onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
      </div>
    </aside>
  );
}
