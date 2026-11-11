'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const empty = {
  name: '',
  description: '',
  price: '',
  stock: '0',
  imageUrl: '',
  featured: false,
  categoryId: '',
};

/** Used for both "new product" and "edit product". Pass productId to edit. */
export default function ProductForm({ productId }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) return;
    api(`/products/${productId}`)
      .then(({ product }) =>
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price),
          stock: String(product.stock),
          imageUrl: product.imageUrl,
          featured: product.featured,
          categoryId: product.categoryId ? String(product.categoryId) : '',
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    try {
      await api(productId ? `/products/${productId}` : '/products', {
        method: productId ? 'PUT' : 'POST',
        body,
      });
      router.push('/admin/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{productId ? 'Edit product' : 'Add product'}</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-800">← Back</Link>
      </div>

      <div className="card grid gap-5 p-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={6}
              className="input"
              value={form.description}
              onChange={set('description')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input"
                value={form.price}
                onChange={set('price')}
              />
            </div>
            <div>
              <label className="label" htmlFor="stock">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                required
                className="input"
                value={form.stock}
                onChange={set('stock')}
              />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" className="input" value={form.categoryId} onChange={set('categoryId')}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="imageUrl">Image URL</label>
            <input
              id="imageUrl"
              type="url"
              className="input"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={set('imageUrl')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} />
            Show on the home page as a featured product
          </label>
        </div>

        <div>
          <p className="label">Preview</p>
          <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
        </button>
        <Link href="/admin/products" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
