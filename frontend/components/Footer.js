import Link from 'next/link';
import { STORE_NAME } from '@/lib/format';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>
        <div className="flex gap-5">
          <Link href="/products" className="hover:text-gray-800">Shop</Link>
          <Link href="/cart" className="hover:text-gray-800">Cart</Link>
          <Link href="/orders" className="hover:text-gray-800">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
