import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import MasonryGrid from './components/MasonryGrid';
import Pagination from './components/Pagination';
import CreateEditModal from './components/CreateEditModal';
import Discovery from './components/Discovery';
import SearchById from './components/SearchById';
import './App.css';

function AppContent() {
  const { currentUser, posts, loading } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  // Mostrar modal de auth si no hay usuario
  useEffect(() => {
    if (!currentUser) {
      setShowAuthModal(true);
    }
  }, [currentUser]);

  const handleCreateClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleEditClick = (post) => {
    setEditingPost(post);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setEditingPost(null);
  };

  const handleDiscoveryClick = () => {
    setCurrentView('discovery');
  };

  const handleHomeClick = () => {
    setCurrentView('home');
  };

  return (
    <div className="app">
      <Header
        onCreateClick={handleCreateClick}
        onDiscoveryClick={handleDiscoveryClick}
        onHomeClick={handleHomeClick}
        currentView={currentView}
      />

      <main className="app-content">
        {currentView === 'home' ? (
          <>
            <SearchById onEdit={handleEditClick} />
            {loading ? (
              <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Cargando pins...</p>
              </div>
            ) : (
              <>
                <MasonryGrid posts={posts} onEdit={handleEditClick} />
                <Pagination />
              </>
            )}
          </>
        ) : (
          <Discovery />
        )}
      </main>

      {/* Modals */}
      {showAuthModal && !currentUser && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showCreateModal && (
        <CreateEditModal onClose={handleCloseModals} />
      )}

      {editingPost && (
        <CreateEditModal
          onClose={handleCloseModals}
          editPost={editingPost}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
