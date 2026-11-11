import { Suspense } from 'react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import Pagination from '@/components/Pagination';

export const metadata = { title: 'Shop' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const params = {
    search: sp.search || '',
    category: sp.category || '',
    sort: sp.sort || '',
    page: sp.page || '',
  };

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) query.set(k, v);
  query.set('limit', '12');

  let products = [];
  let pagination = { page: 1, pages: 1, total: 0 };
  let categories = [];
  let error = null;
  try {
    const [p, c] = await Promise.all([api(`/products?${query}`), api('/categories')]);
    products = p.products;
    pagination = p.pagination;
    categories = c.categories;
  } catch (e) {
    error = e.message;
  }

  const activeCategory = categories.find((c) => c.slug === params.category);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{activeCategory ? activeCategory.name : 'All products'}</h1>
        <p className="mt-1 text-gray-500">
          {params.search ? `Results for “${params.search}” · ` : ''}
          {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <Suspense fallback={null}>
          <ProductFilters categories={categories} />
        </Suspense>

        <div>
          {error && <div className="alert-error mb-6">{error}</div>}
          {!error && products.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            basePath="/products"
            params={params}
          />
        </div>
      </div>
    </div>
  );
}
