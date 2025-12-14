import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './PinCard.css';

const PinCard = ({ post, onEdit }) => {
  const { currentUser, deletePost } = useApp();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const isOwner = currentUser === post.usuario;

  // Detectar si es un dispositivo táctil
  useEffect(() => {
    const checkTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(checkTouch);
  }, []);

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
    } catch (error) {
      alert(error.message);
    }
  };

  // Manejar click en la imagen para dispositivos táctiles
  const handleImageClick = () => {
    if (isTouchDevice && isOwner) {
      setShowActions(!showActions);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className="pin-card"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
    >
      {/* Image */}
      <div className="pin-image-container" onClick={handleImageClick}>
        {!imageLoaded && (
          <div className="pin-skeleton">
            <div className="skeleton-pulse"></div>
          </div>
        )}
        <img
          src={post.link_imagen}
          alt={post.etiquetas?.join(', ') || 'Pin'}
          className={`pin-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src =
              'https://via.placeholder.com/400x600/f0f0f0/999?text=Imagen+no+disponible';
            setImageLoaded(true);
          }}
        />

        {/* Overlay actions */}
        {showActions && imageLoaded && (
          <div className="pin-overlay">
            <div className="pin-overlay-actions">
              {isOwner && (
                <>
                  <button
                    className="pin-action-btn edit"
                    onClick={() => onEdit(post)}
                    title="Editar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {!showDeleteConfirm ? (
                    <button
                      className="pin-action-btn delete"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      className="pin-action-btn delete-confirm"
                      onClick={handleDelete}
                      title="Confirmar eliminación"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pin-info">
        <div className="pin-user">
          <div className="pin-user-avatar">
            {post.usuario.charAt(0).toUpperCase()}
          </div>
          <div className="pin-user-details">
            <div className="pin-user-name">{post.usuario}</div>
            <div className="pin-date">{formatDate(post.fecha_alta)}</div>
          </div>
        </div>

        {post.etiquetas && post.etiquetas.length > 0 && (
          <div className="pin-tags">
            {post.etiquetas.slice(0, 3).map((tag, index) => (
              <span key={index} className="pin-tag">
                {tag}
              </span>
            ))}
            {post.etiquetas.length > 3 && (
              <span className="pin-tag-more">+{post.etiquetas.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinCard;
