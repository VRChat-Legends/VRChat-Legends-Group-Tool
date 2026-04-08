/**
 * Paginator – prev/next buttons + page info.
 * Props:
 *   total      – total item count
 *   page       – current 1-based page number
 *   pageSize   – items per page (default 10)
 *   onPage     – callback(newPage)
 */
export default function Paginator({ total, page, pageSize = 10, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Build a compact page-number list: always show 1, totalPages, and up to 2 around current
  function pageNumbers() {
    const nums = new Set([1, totalPages]);
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) nums.add(i);
    return [...nums].sort((a, b) => a - b);
  }

  const pages = pageNumbers();

  return (
    <div className="flex items-center gap-2 pt-4 mt-2 border-t border-white/[0.06] flex-wrap">
      <span className="text-xs text-surface-500 mr-auto">
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-surface-800 border border-surface-700 text-surface-300
                     hover:bg-surface-700 hover:text-white transition-colors
                     disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-surface-800 disabled:hover:text-surface-300"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4L6 8l4 4" />
          </svg>
          Prev
        </button>

        {/* Page numbers */}
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const gap = prev && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && <span className="text-surface-600 text-xs px-1">…</span>}
              <button
                type="button"
                onClick={() => onPage(p)}
                className={`w-8 h-7 rounded-lg text-xs font-medium transition-colors
                  ${p === page
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-white'
                  }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        {/* Next */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-surface-800 border border-surface-700 text-surface-300
                     hover:bg-surface-700 hover:text-white transition-colors
                     disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-surface-800 disabled:hover:text-surface-300"
        >
          Next
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
