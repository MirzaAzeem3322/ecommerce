'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/categories')
      .then((d) => setCategories(d.categories))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/categories', { method: 'POST', body: { name: name.trim() } });
      setName('');
    });
  };

  const save = () =>
    run(async () => {
      await api(`/categories/${editing.id}`, { method: 'PUT', body: { name: editing.name.trim() } });
      setEditing(null);
    });

  const remove = (c) => {
    const msg = c.productCount
      ? `Delete "${c.name}"? Its ${c.productCount} products will be left without a category.`
      : `Delete "${c.name}"?`;
    if (window.confirm(msg)) run(() => api(`/categories/${c.id}`, { method: 'DELETE' }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <form onSubmit={add} className="flex gap-2">
        <input
          className="input"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <button className="btn btn-primary whitespace-nowrap">Add category</button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      <div className="card divide-y divide-gray-100">
        {!categories && <p className="p-4 text-gray-500">Loading…</p>}
        {categories?.length === 0 && <p className="p-4 text-gray-500">No categories yet.</p>}
        {categories?.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 p-4">
            {editing?.id === c.id ? (
              <input
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
            ) : (
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-gray-500">/{c.slug} · {c.productCount} products</p>
              </div>
            )}
            <div className="flex shrink-0 gap-3 text-sm">
              {editing?.id === c.id ? (
                <>
                  <button onClick={save} className="font-medium text-brand-600 hover:underline">Save</button>
                  <button onClick={() => setEditing(null)} className="text-gray-500 hover:underline">Cancel</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing({ id: c.id, name: c.name })}
                    className="text-brand-600 hover:underline"
                  >
                    Rename
                  </button>
                  <button onClick={() => remove(c)} className="text-red-600 hover:underline">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
