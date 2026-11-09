export default function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <div className="join">
        <button type="button" className="btn btn-sm join-item" disabled={page <= 1} onClick={() => onPage(page - 1)}>«</button>
        <button type="button" className="btn btn-sm join-item pointer-events-none">Page {page} / {pages}</button>
        <button type='button' className="btn btn-sm join-item" disabled={page >= pages} onClick={() => onPage(page + 1)}>»</button>
      </div>
      <span className="text-xs opacity-60">{total} results</span>
    </div>
  );
}