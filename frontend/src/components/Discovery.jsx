import { useState, useEffect } from 'react';
import { discoveryAPI } from '../services/api';
import './Discovery.css';

const Discovery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await discoveryAPI.getPhotos(20);
      setPhotos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-2 px-sm-3 px-lg-4 py-4">
        <div className="row mb-4">
          <div className="col-12">
            <h2>Descubrir</h2>
            <p>Explora imágenes increíbles de Unsplash</p>
          </div>
        </div>
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-sm-3 g-lg-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="col">
              <div className="discovery-skeleton">
                <div className="skeleton-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="discovery-error">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2" />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="#e74c3c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <h3>Error al cargar imágenes</h3>
              <p>{error}</p>
              <button onClick={loadPhotos} className="retry-btn">
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-sm-3 px-lg-4 py-4">
      <div className="discovery-header row align-items-center mb-4">
        <div className="col-12 col-md-8">
          <h2>Descubrir</h2>
          <p>Imágenes curadas de Unsplash</p>
        </div>
        <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
          <button onClick={loadPhotos} className="refresh-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M1 4v6h6M23 20v-6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Recargar
          </button>
        </div>
      </div>

      <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-sm-3 g-lg-4">
        {photos.map((photo) => (
          <div key={photo.id} className="col">
            <div className="discovery-photo">
              <img
                src={photo.url}
                alt={photo.alt_description || 'Unsplash photo'}
                loading="lazy"
              />
              <div className="discovery-photo-overlay">
                <div className="discovery-photo-author">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {photo.author}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="discovery-footer">
        <p>
          Imágenes por{' '}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unsplash
          </a>
        </p>
      </div>
    </div>
  );
};

export default Discovery;
