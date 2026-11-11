'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isRegister
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password);
      router.push(safeNext || (user.role === 'ADMIN' ? '/admin' : '/'));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const otherHref = `${isRegister ? '/login' : '/register'}${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`;

  return (
    <div className="container-page flex justify-center py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-5 p-8">
        <div>
          <h1 className="text-2xl font-bold">{isRegister ? 'Create an account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isRegister ? 'Sign up to place orders and track deliveries.' : 'Log in to continue.'}
          </p>
        </div>

        {isRegister && (
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" required value={form.name} onChange={set('name')} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            required
            minLength={isRegister ? 6 : undefined}
            value={form.password}
            onChange={set('password')}
          />
        </div>

        {error && <div className="alert-error">{error}</div>}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link href={otherHref} className="font-medium text-brand-600 hover:underline">
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </div>
  );
}
