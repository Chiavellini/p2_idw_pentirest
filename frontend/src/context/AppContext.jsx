import { createContext, useContext, useState, useEffect } from 'react';
import { storage, postsAPI } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const limit = 6;

  // Cargar usuario al iniciar
  useEffect(() => {
    const user = storage.getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Función para login
  const login = (username) => {
    storage.setUser(username);
    setCurrentUser(username);
  };

  // Función para logout
  const logout = () => {
    storage.removeUser();
    setCurrentUser(null);
  };

  // Cargar posts con caché de localStorage
  const loadPosts = async (pageNum = 1, useCache = true) => {
    try {
      setLoading(true);

      // Si es la primera página y hay cache, usar cache primero
      if (pageNum === 1 && useCache) {
        const cachedPosts = storage.getPosts();
        const timestamp = storage.getTimestamp();

        if (cachedPosts && timestamp) {
          // PRIMERO obtener el total completo para actualizar totalPages inmediatamente
          const dataTotal = await postsAPI.getAll(pageNum, limit);
          const calculatedTotalPages = Math.ceil(dataTotal.total / limit);
          setTotalPages(calculatedTotalPages);
          setTotalPosts(dataTotal.total);
          
          // Mostrar solo los primeros 'limit' posts del caché
          const limitedCachedPosts = cachedPosts.slice(0, limit);
          setPosts(limitedCachedPosts);
          setPage(1);
          setLoading(false);

          // Cargar posts nuevos en segundo plano (con min_date para obtener solo nuevos)
          const dataNew = await postsAPI.getAll(pageNum, limit, timestamp);

          if (dataNew.posts.length > 0) {
            // Combinar posts nuevos con cache
            const combinedPosts = [...dataNew.posts, ...cachedPosts];
            const uniquePosts = Array.from(
              new Map(combinedPosts.map(post => [post.id, post])).values()
            );
            // Mostrar solo los primeros 'limit' posts
            const limitedPosts = uniquePosts.slice(0, limit);
            setPosts(limitedPosts);
            // Guardar solo los primeros 'limit' posts en el caché
            storage.setPosts(limitedPosts);
          } else {
            // Si no hay posts nuevos, asegurar que el caché tenga solo 'limit' posts
            storage.setPosts(limitedCachedPosts);
          }

          storage.setTimestamp(new Date().toISOString());
          return;
        }
      }

      // Llamada normal a la API
      const data = await postsAPI.getAll(pageNum, limit);
      console.log('loadPosts API Response:', { pageNum, limit, total: data.total, postsCount: data.posts.length });
      
      setPosts(data.posts);
      setPage(pageNum);
      const calculatedTotalPages = Math.ceil(data.total / limit);
      console.log('Calculated totalPages:', { total: data.total, limit, calculatedTotalPages });
      setTotalPages(calculatedTotalPages);
      setTotalPosts(data.total);

      // Guardar en cache solo la primera página
      if (pageNum === 1) {
        storage.setPosts(data.posts);
        storage.setTimestamp(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error al cargar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear post
  const createPost = async (postData) => {
    const newPost = await postsAPI.create(postData);
    await loadPosts(1, false); // Recargar sin usar cache
    return newPost;
  };

  // Actualizar post
  const updatePost = async (id, postData) => {
    const updatedPost = await postsAPI.update(id, postData, currentUser);
    await loadPosts(page, false);
    return updatedPost;
  };

  // Eliminar post
  const deletePost = async (id) => {
    await postsAPI.delete(id, currentUser);
    await loadPosts(page, false);
  };

  // Cambiar de página
  const goToPage = (newPage) => {
    // Validar que newPage sea un número válido
    const pageNum = parseInt(newPage);
    if (isNaN(pageNum) || pageNum < 1) {
      console.warn(`Página inválida: ${newPage}`);
      return;
    }
    
    // Cargar la página (la validación de totalPages se hace en loadPosts si es necesario)
    loadPosts(pageNum, false);
  };

  // Cargar posts al iniciar
  useEffect(() => {
    loadPosts();
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    posts,
    loading,
    page,
    totalPages,
    totalPosts,
    limit,
    loadPosts,
    createPost,
    updatePost,
    deletePost,
    goToPage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
