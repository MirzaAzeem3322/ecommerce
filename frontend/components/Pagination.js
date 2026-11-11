import Link from 'next/link';

/**
 * Server-friendly pagination: builds links from the current query params.
 * Phones: compact "← 2 / 10 →". Larger screens: numbered pages with "…" gaps.
 */
export default function Pagination({ page, pages, basePath, params = {} }) {
  if (pages <= 1) return null;

  const href = (p) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') q.set(k, v);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  // First, last, and up to 2 pages around the current one, e.g. 1 … 4 5 [6] 7 8 … 20
  const numbers = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 2) numbers.push(p);
    else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
  }

  const prev = page > 1 ? (
    <Link href={href(page - 1)} className="btn btn-secondary" aria-label="Previous page">
      ← <span className="hidden sm:inline">Prev</span>
    </Link>
  ) : (
    <span className="btn btn-secondary pointer-events-none opacity-40">←</span>
  );

  const next = page < pages ? (
    <Link href={href(page + 1)} className="btn btn-secondary" aria-label="Next page">
      <span className="hidden sm:inline">Next</span> →
    </Link>
  ) : (
    <span className="btn btn-secondary pointer-events-none opacity-40">→</span>
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      {prev}

      {/* Phone */}
      <span className="px-3 text-sm text-gray-600 sm:hidden">
        Page {page} / {pages}
      </span>

      {/* Tablet and up */}
      <div className="hidden items-center gap-2 sm:flex">
        {numbers.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'} min-w-10`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {next}
    </nav>
  );
}
