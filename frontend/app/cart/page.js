'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice, FREE_SHIPPING_OVER, shippingFor } from '@/lib/format';

export default function CartPage() {
  const { items, ready, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  if (!ready) return <div className="container-page py-20 text-center text-gray-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-gray-500">Looks like you haven’t added anything yet.</p>
        <Link href="/products" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);
  const remainingForFree = FREE_SHIPPING_OVER - subtotal;

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">Shopping cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="card divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/products/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-2">
                <div className="flex justify-between gap-2 sm:gap-4">
                  <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-600 sm:text-base">
                    {item.name}
                  </Link>
                  <span className="shrink-0 text-sm font-semibold sm:text-base">{formatPrice(item.price * item.quantity)}</span>
                </div>
                <p className="text-xs text-gray-500 sm:text-sm">{formatPrice(item.price)} each</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border border-gray-300">
                    <button
                      className="px-3 py-1.5"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      className="px-3 py-1.5 disabled:opacity-40"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= (item.stock ?? 99)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="py-1 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="p-4 text-right">
            <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600">
              Clear cart
            </button>
          </div>
        </div>

        <div className="card h-fit space-y-3 p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          {remainingForFree > 0 && (
            <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700">
              Add {formatPrice(remainingForFree)} more for free shipping.
            </p>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal + shipping)}</span>
          </div>
          <Link href="/checkout" className="btn btn-primary w-full py-3">
            Proceed to checkout
          </Link>
          <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-gray-800">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
