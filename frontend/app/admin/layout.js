'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/users', 'Customers'],
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <RequireAuth admin>
      <div className="container-page grid gap-8 py-10 md:grid-cols-[200px_1fr]">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Admin</p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {links.map(([href, label]) => {
              const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                    active ? 'bg-brand-600 font-medium text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </RequireAuth>
  );
}
