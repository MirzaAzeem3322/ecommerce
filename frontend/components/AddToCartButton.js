'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function AddToCartButton({ product, compact = false }) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.productId === product.id)?.quantity || 0;
  const available = Math.max(0, product.stock - inCart);
  const outOfStock = product.stock <= 0;

  const add = () => {
    addItem(product, compact ? 1 : quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (compact) {
    return (
      <button
        className="btn btn-primary px-3 py-1.5"
        onClick={add}
        disabled={outOfStock || available === 0}
      >
        {outOfStock ? 'Sold out' : added ? 'Added ✓' : 'Add'}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-300 bg-white">
        <button
          className="px-3 py-2 text-lg disabled:opacity-40"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-10 text-center font-medium">{quantity}</span>
        <button
          className="px-3 py-2 text-lg disabled:opacity-40"
          onClick={() => setQuantity((q) => Math.min(available, q + 1))}
          disabled={quantity >= available}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        className="btn btn-primary px-6 py-3"
        onClick={add}
        disabled={outOfStock || available === 0 || quantity > available}
      >
        {outOfStock
          ? 'Out of stock'
          : available === 0
            ? 'All stock in your cart'
            : added
              ? 'Added to cart ✓'
              : 'Add to cart'}
      </button>
    </div>
  );
}
