import { useState } from 'react';
import { postsAPI } from '../services/api';
import PinCard from './PinCard';
import './SearchById.css';

const SearchById = ({ onEdit }) => {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundPost, setFoundPost] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      setError('Por favor ingresa un ID');
      return;
    }

    const id = parseInt(searchId.trim());
    if (isNaN(id) || id <= 0) {
      setError('El ID debe ser un número positivo');
      return;
    }

    setLoading(true);
    setError('');
    setFoundPost(null);

    try {
      const post = await postsAPI.getById(id);
      setFoundPost(post);
    } catch (err) {
      setError(err.message || 'Post no encontrado');
      setFoundPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchId('');
    setError('');
    setFoundPost(null);
  };

  return (
    <div className="search-by-id">
      <form onSubmit={handleSearch} className="search-by-id-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              setError('');
              setFoundPost(null);
            }}
            placeholder="Ej: 1, 2, 3..."
            className="search-input"
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? (
              <div className="search-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          {(searchId || foundPost) && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              title="Limpiar búsqueda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="search-hint">
          Ingresa un número entero (ID del pin)
        </div>
        {error && <div className="search-error">{error}</div>}
      </form>

      {foundPost && (
        <div className="search-result">
          <div className="search-result-header">
            <h3>Pin encontrado</h3>
          </div>
          <div className="search-result-content">
            <div className="container-fluid px-2 px-sm-3 px-lg-4">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-2 g-sm-3 g-lg-4">
                <div className="col">
                  <PinCard post={foundPost} onEdit={onEdit} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchById;

