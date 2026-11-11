import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import AddToCartButton from './AddToCartButton';

export default function ProductCard({ product }) {
  const outOfStock = product.stock <= 0;

  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-gray-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-gray-900/80 px-2 py-1 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {product.category.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="font-semibold hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </div>
  );
}
