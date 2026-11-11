import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import HeroScene from '@/components/HeroScene';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const [featured, latest, cats] = await Promise.all([
      api('/products?featured=true&limit=4'),
      api('/products?limit=8'),
      api('/categories'),
    ]);
    return { featured: featured.products, latest: latest.products, categories: cats.categories };
  } catch (error) {
    return { featured: [], latest: [], categories: [], error: error.message };
  }
}

export default async function HomePage() {
  const { featured, latest, categories, error } = await getData();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <HeroScene />
        <div className="container-page relative z-10 flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm">Free shipping on orders over $100</span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Everything you love, delivered to your door.
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            Discover quality products across electronics, fashion, home and more.
          </p>
          <Link href="/products" className="btn bg-white px-6 py-3 text-brand-700 hover:bg-gray-100">
            Start shopping →
          </Link>
        </div>
      </section>

      <div className="container-page space-y-16 py-14">
        {error && (
          <div className="alert-error">
            Could not load products: {error}. Make sure the backend is running.
          </div>
        )}

        {categories.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Shop by category</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="card p-6 text-center transition hover:border-brand-500 hover:shadow-md"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.productCount} products</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Featured</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {latest.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">New arrivals</h2>
              <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {latest.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
