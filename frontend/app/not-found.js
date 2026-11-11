import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-500">The page you are looking for doesn’t exist or was moved.</p>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
