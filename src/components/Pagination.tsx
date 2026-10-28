import Link from 'next/link';

interface PaginationProps { currentPage: number; totalPages: number; baseUrl: string; searchParams: Record<string, string | undefined> }

export default function Pagination({ currentPage, totalPages, baseUrl, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;
  const url = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => { if (value && key !== 'page') params.set(key, value); });
    if (page > 1) params.set('page', String(page));
    return `${baseUrl}${params.size ? `?${params}` : ''}`;
  };
  const pages: (number | '…')[] = [];
  for (let page = 1; page <= totalPages; page++) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) pages.push(page);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return <nav className="pagination" aria-label="Pages">
    {currentPage > 1 ? <Link href={url(currentPage - 1)} className="page-arrow">← Previous</Link> : <span className="page-arrow disabled">← Previous</span>}
    {pages.map((page, index) => page === '…' ? <span key={`dots-${index}`} className="page-dots">…</span> : <Link key={page} href={url(page)} className={`page-number ${page === currentPage ? 'active' : ''}`} aria-current={page === currentPage ? 'page' : undefined}>{page}</Link>)}
    {currentPage < totalPages ? <Link href={url(currentPage + 1)} className="page-arrow">Next →</Link> : <span className="page-arrow disabled">Next →</span>}
  </nav>;
}
