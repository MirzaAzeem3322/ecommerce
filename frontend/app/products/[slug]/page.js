import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

async function getProduct(slug) {
  try {
    return await api(`/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug).catch(() => null);
  return data
    ? { title: data.product.name, description: data.product.description.slice(0, 160) }
    : { title: 'Product not found' };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, related } = data;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/products" className="hover:text-gray-800">Shop</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-800">
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="card overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-gray-100 text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-3 text-3xl font-bold text-brand-700">{formatPrice(product.price)}</p>
          </div>

          <p>
            {product.stock <= 0 ? (
              <span className="font-medium text-red-600">Out of stock</span>
            ) : lowStock ? (
              <span className="font-medium text-orange-600">Only {product.stock} left — order soon</span>
            ) : (
              <span className="font-medium text-green-700">In stock</span>
            )}
          </p>

          <AddToCartButton product={product} />

          <div className="border-t border-gray-200 pt-5">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-600">
              {product.description || 'No description yet.'}
            </p>
          </div>

          <ul className="space-y-1 text-sm text-gray-500">
            <li>✓ Free shipping on orders over $100</li>
            <li>✓ Cash on delivery available</li>
            <li>✓ Easy 14-day returns</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={{ ...p, category: product.category }} />)}
          </div>
        </section>
      )}
    </div>
  );
}
