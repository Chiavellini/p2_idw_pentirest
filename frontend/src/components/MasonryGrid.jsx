import { useEffect, useRef } from 'react';
import PinCard from './PinCard';
import './MasonryGrid.css';

const MasonryGrid = ({ posts, onEdit }) => {
  const gridRef = useRef(null);

  useEffect(() => {
    const resizeAllGridItems = () => {
      const grid = gridRef.current;
      if (!grid) return;

      const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap'));
      const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));

      const items = grid.querySelectorAll('.masonry-item');
      items.forEach((item) => {
        const content = item.querySelector('.pin-card');
        if (content) {
          const contentHeight = content.getBoundingClientRect().height;
          const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
          item.style.gridRowEnd = `span ${rowSpan}`;
        }
      });
    };

    const timer = setTimeout(resizeAllGridItems, 100);
    window.addEventListener('resize', resizeAllGridItems);

    const images = gridRef.current?.querySelectorAll('img');
    images?.forEach((img) => {
      if (img.complete) {
        resizeAllGridItems();
      } else {
        img.addEventListener('load', resizeAllGridItems);
      }
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resizeAllGridItems);
      images?.forEach((img) => {
        img.removeEventListener('load', resizeAllGridItems);
      });
    };
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="masonry-empty">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="60" fill="#f0f0f0" />
                <path
                  d="M60 30v60M30 60h60"
                  stroke="#ccc"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <h3>No hay pins todavía</h3>
              <p>Crea tu primer pin para comenzar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masonry-container">
      <div className="masonry-grid" ref={gridRef}>
        {posts.map((post) => (
          <div key={post.id} className="masonry-item">
            <PinCard post={post} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryGrid;
