import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './CreateEditModal.css';

const CreateEditModal = ({ onClose, editPost = null }) => {
  const { currentUser, createPost, updatePost } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    usuario: currentUser || '',
    link_imagen: '',
    etiquetas: '',
  });

  useEffect(() => {
    if (editPost) {
      setFormData({
        usuario: editPost.usuario,
        link_imagen: editPost.link_imagen,
        etiquetas: editPost.etiquetas?.join(', ') || '',
      });
    }
  }, [editPost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const postData = {
        usuario: formData.usuario.trim(),
        link_imagen: formData.link_imagen.trim(),
        etiquetas: formData.etiquetas
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      if (editPost) {
        await updatePost(editPost.id, postData);
      } else {
        await createPost(postData);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <div className="create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-modal-header">
          <h2>{editPost ? 'Editar Pin' : 'Crear Nuevo Pin'}</h2>
          <button className="create-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-modal-form">
          {error && <div className="create-modal-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              required
              disabled={!!editPost}
            />
          </div>

          <div className="form-field">
            <label htmlFor="link_imagen">URL de Imagen</label>
            <input
              type="url"
              id="link_imagen"
              name="link_imagen"
              value={formData.link_imagen}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
            {formData.link_imagen && (
              <div className="image-preview">
                <img
                  src={formData.link_imagen}
                  alt="Preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="etiquetas">
              Etiquetas
              <span className="field-hint">(separadas por comas)</span>
            </label>
            <input
              type="text"
              id="etiquetas"
              name="etiquetas"
              value={formData.etiquetas}
              onChange={handleChange}
              placeholder="naturaleza, paisaje, montaña"
            />
            {formData.etiquetas && (
              <div className="tags-preview">
                {formData.etiquetas
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag)
                  .map((tag, index) => (
                    <span key={index} className="tag-preview">
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="create-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  {editPost ? 'Guardando...' : 'Creando...'}
                </>
              ) : editPost ? (
                'Guardar Cambios'
              ) : (
                'Crear Pin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditModal;
