import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './AuthModal.css';

const AuthModal = ({ onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
      onClose();
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="auth-modal-content">
          <div className="auth-modal-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#e60023" opacity="0.1" />
              <path
                d="M32 16C23.163 16 16 23.163 16 32s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zm0 29.5c-7.456 0-13.5-6.044-13.5-13.5S24.544 18.5 32 18.5 45.5 24.544 45.5 32 39.456 45.5 32 45.5z"
                fill="#e60023"
              />
              <circle cx="32" cy="32" r="8" fill="#e60023" />
            </svg>
          </div>

          <h2 className="auth-modal-title">Bienvenido a Pentirest</h2>
          <p className="auth-modal-description">
            Crea un nombre de usuario para comenzar a crear y guardar tus pins favoritos
          </p>

          <form onSubmit={handleSubmit} className="auth-modal-form">
            <div className="form-group">
              <label htmlFor="username">Nombre de Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu nombre de usuario"
                autoFocus
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn">
              Continuar
            </button>
          </form>

          <p className="auth-modal-footer">
            Tu nombre de usuario se guardará localmente en tu navegador
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
