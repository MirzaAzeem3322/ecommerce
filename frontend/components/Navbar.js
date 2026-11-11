'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { STORE_NAME } from '@/lib/format';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count, ready } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMenuOpen(false);
  };

  const navLink = (href, label) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-medium hover:text-brand-600 ${
        pathname === href || (href !== '/' && pathname.startsWith(href))
          ? 'text-brand-600'
          : 'text-gray-700'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          {STORE_NAME}
        </Link>

        <form onSubmit={onSearch} className="hidden flex-1 md:block">
          <input
            className="input max-w-md"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <nav className="ml-auto hidden items-center gap-5 md:flex">
          {navLink('/products', 'Shop')}
          {user && navLink('/orders', 'My Orders')}
          {isAdmin && navLink('/admin', 'Admin')}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Hi, {user.name.split(' ')[0]}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="text-sm font-medium text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            navLink('/login', 'Login')
          )}
          <CartLink count={ready ? count : 0} />
        </nav>

        <div className="ml-auto flex items-center gap-3 md:hidden">
          <CartLink count={ready ? count : 0} />
          <button
            className="btn btn-secondary px-3"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-4 py-4">
            <form onSubmit={onSearch}>
              <input
                className="input"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {navLink('/products', 'Shop')}
            {user && navLink('/orders', 'My Orders')}
            {isAdmin && navLink('/admin', 'Admin')}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  router.push('/');
                }}
                className="text-left text-sm font-medium text-red-600"
              >
                Logout
              </button>
            ) : (
              navLink('/login', 'Login')
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function CartLink({ count }) {
  return (
    <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-brand-600">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
