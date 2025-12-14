import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Header.css';

const Header = ({ onCreateClick, onDiscoveryClick, onHomeClick, currentView }) => {
  const { currentUser, logout } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo" onClick={onHomeClick} style={{ cursor: 'pointer' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 29.5C8.544 29.5 2.5 23.456 2.5 16S8.544 2.5 16 2.5 29.5 8.544 29.5 16 23.456 29.5 16 29.5z"
              fill="currentColor"
            />
            <circle cx="16" cy="16" r="8" fill="currentColor" />
          </svg>
          <span className="header-title">Pinfinity</span>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <button
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={onHomeClick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Inicio</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'discovery' ? 'active' : ''}`}
            onClick={onDiscoveryClick}
          >
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
            <span>Descubrir</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {currentUser && (
            <button className="create-btn" onClick={onCreateClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>Crear</span>
            </button>
          )}

          {/* User Avatar */}
          <div className="user-avatar-container">
            <button
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {currentUser ? currentUser.charAt(0).toUpperCase() : '?'}
            </button>

            {showUserMenu && (
              <div className="user-menu">
                {currentUser ? (
                  <>
                    <div className="user-menu-header">
                      <div className="user-menu-name">{currentUser}</div>
                      <div className="user-menu-email">@{currentUser}</div>
                    </div>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item" onClick={onHomeClick}>
                      Mis Pins
                    </button>
                    <button className="user-menu-item danger" onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}>
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <button className="user-menu-item">Iniciar Sesión</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
