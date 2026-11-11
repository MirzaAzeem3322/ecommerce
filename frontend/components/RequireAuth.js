'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/** Wrap pages that need a logged-in user (optionally an admin). */
export default function RequireAuth({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (admin && !isAdmin) router.replace('/');
  }, [loading, user, isAdmin, admin, router, pathname]);

  if (loading || !user || (admin && !isAdmin)) {
    return <div className="container-page py-20 text-center text-gray-500">Loading…</div>;
  }
  return children;
}
