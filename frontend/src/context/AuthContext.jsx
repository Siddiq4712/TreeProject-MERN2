import { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          // Handle both _id and id
          const userData = res.data;
          if (userData._id && !userData.id) {
            userData.id = userData._id;
          }
          setUser(userData);
        })
        .catch((error) => {
          console.error('AuthContext /auth/me failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            baseURL: api.defaults.baseURL,
          });
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const normalizeUser = (rawUser) => {
    const userData = { ...rawUser };
    if (userData._id && !userData.id) {
      userData.id = userData._id;
    }
    return userData;
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      const userData = normalizeUser(res.data.user);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext login failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        baseURL: api.defaults.baseURL,
      });
      throw error;
    }
  };

  const register = async (payload) => {
    try {
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('token', res.data.token);
      const userData = normalizeUser(res.data.user);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext register failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        baseURL: api.defaults.baseURL,
        payload: {
          ...payload,
          password: payload.password ? '[hidden]' : undefined,
        },
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
