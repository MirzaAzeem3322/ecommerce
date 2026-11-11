'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'shop_cart';
const CartContext = createContext(null);

/**
 * The cart lives in localStorage so guests can shop before logging in.
 * Prices here are for display only — the server recalculates everything when an order is placed.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      /* ignore broken data */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable */
    }
  }, [items, ready]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === product.id);
      const max = product.stock ?? 99;
      if (existing) {
        return current.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, max), stock: max }
            : i
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          stock: max,
          quantity: Math.min(quantity, max),
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock ?? 99)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items, ready, count, subtotal, addItem, updateQuantity, removeItem, clearCart };
  }, [items, ready, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
