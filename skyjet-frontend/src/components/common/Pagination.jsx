import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;

  const maxVisible = 7;
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(lastPage, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={13} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="pagination-btn"
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}