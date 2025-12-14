// Configuración de API Base URL
const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

const API_BASE = isLocal
  ? 'http://127.0.0.1:8000'      // cuando estoy probando en mi compu
  : 'http://127.0.0.1:8000';     // cuando está desplegado en GitHub Pages

// ============================================================================
// POSTS API
// ============================================================================

export const postsAPI = {
  // Obtener posts con paginación
  getAll: async (page = 1, limit = 6, minDate = null) => {
    let url = `${API_BASE}/api/posts?page=${page}&limit=${limit}`;
    if (minDate) {
      url += `&min_date=${minDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar posts');
    return response.json();
  },

  // Obtener un post por ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE}/api/posts/${id}`);
    if (!response.ok) throw new Error('Post no encontrado');
    return response.json();
  },

  // Crear nuevo post
  create: async (postData) => {
    const response = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear post');
    }
    return response.json();
  },

  // Actualizar post existente
  update: async (id, postData, currentUser) => {
    const response = await fetch(`${API_BASE}/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User': currentUser,
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar post');
    }
    return response.json();
  },

  // Eliminar post
  delete: async (id, currentUser) => {
    const response = await fetch(`${API_BASE}/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User': currentUser,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar post');
    }
    return true;
  },
};

// ============================================================================
// DISCOVERY API (Unsplash)
// ============================================================================

export const discoveryAPI = {
  // Obtener fotos de Unsplash
  getPhotos: async (count = 12) => {
    const response = await fetch(`${API_BASE}/api/discovery?count=${count}`);
    if (!response.ok) throw new Error('Error al cargar discovery');
    return response.json();
  },
};

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

export const storage = {
  // Usuario actual
  getUser: () => sessionStorage.getItem('currentUser'),
  setUser: (username) => sessionStorage.setItem('currentUser', username),
  removeUser: () => sessionStorage.removeItem('currentUser'),

  // Posts cache
  getPosts: () => {
    const cached = localStorage.getItem('posts');
    return cached ? JSON.parse(cached) : null;
  },
  setPosts: (posts) => localStorage.setItem('posts', JSON.stringify(posts)),

  // Timestamp del último fetch
  getTimestamp: () => localStorage.getItem('posts_timestamp'),
  setTimestamp: (timestamp) => localStorage.setItem('posts_timestamp', timestamp),
};
