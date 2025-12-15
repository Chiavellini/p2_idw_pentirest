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
  const limit = 10;

  useEffect(() => {
    const user = storage.getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = (username) => {
    storage.setUser(username);
    setCurrentUser(username);
  };

  const logout = () => {
    storage.removeUser();
    setCurrentUser(null);
  };

  const loadPosts = async (pageNum = 1, useCache = true) => {
    try {
      setLoading(true);

      if (pageNum === 1 && useCache) {
        const cachedPosts = storage.getPosts();
        const timestamp = storage.getTimestamp();

        if (cachedPosts && timestamp) {
          const dataTotal = await postsAPI.getAll(pageNum, limit);
          const calculatedTotalPages = Math.ceil(dataTotal.total / limit);
          setTotalPages(calculatedTotalPages);
          setTotalPosts(dataTotal.total);

          const limitedCachedPosts = cachedPosts.slice(0, limit);
          setPosts(limitedCachedPosts);
          setPage(1);
          setLoading(false);

          const dataNew = await postsAPI.getAll(pageNum, limit, timestamp);

          if (dataNew.posts.length > 0) {
            const combinedPosts = [...dataNew.posts, ...cachedPosts];
            const uniquePosts = Array.from(
              new Map(combinedPosts.map(post => [post.id, post])).values()
            );
            const limitedPosts = uniquePosts.slice(0, limit);
            setPosts(limitedPosts);
            storage.setPosts(limitedPosts);
          } else {
            storage.setPosts(limitedCachedPosts);
          }

          storage.setTimestamp(new Date().toISOString());
          return;
        }
      }

      const data = await postsAPI.getAll(pageNum, limit);
      console.log('loadPosts API Response:', { pageNum, limit, total: data.total, postsCount: data.posts.length });

      setPosts(data.posts);
      setPage(pageNum);
      const calculatedTotalPages = Math.ceil(data.total / limit);
      console.log('Calculated totalPages:', { total: data.total, limit, calculatedTotalPages });
      setTotalPages(calculatedTotalPages);
      setTotalPosts(data.total);

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

  const createPost = async (postData) => {
    const newPost = await postsAPI.create(postData);
    await loadPosts(1, false);
    return newPost;
  };

  const updatePost = async (id, postData) => {
    const updatedPost = await postsAPI.update(id, postData, currentUser);
    await loadPosts(page, false);
    return updatedPost;
  };

  const deletePost = async (id) => {
    await postsAPI.delete(id, currentUser);
    await loadPosts(page, false);
  };

  const goToPage = (newPage) => {
    const pageNum = parseInt(newPage);
    if (isNaN(pageNum) || pageNum < 1) {
      console.warn(`Página inválida: ${newPage}`);
      return;
    }

    loadPosts(pageNum, false);
  };

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
