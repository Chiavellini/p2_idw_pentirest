import { useApp } from '../context/AppContext';
import './Pagination.css';

const Pagination = () => {
  const { page, totalPages, goToPage, totalPosts, limit } = useApp();

  console.log('Pagination Debug:', { page, totalPages, totalPosts, limit, shouldShow: totalPages > 1 });

  if (totalPosts === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalPosts);

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-info-text">
          Mostrando <strong>{startItem}-{endItem}</strong> de <strong>{totalPosts}</strong> pins
        </span>
        {totalPages > 1 && (
          <span className="pagination-pages-info">
            (Página {page} de {totalPages})
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Página anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="pagination-btn-text">Anterior</span>
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((pageNum, index) =>
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  className={`pagination-number ${pageNum === page ? 'active' : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-btn"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Página siguiente"
          >
            <span className="pagination-btn-text">Siguiente</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
