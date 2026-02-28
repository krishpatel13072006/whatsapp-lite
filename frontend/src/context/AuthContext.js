import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '${API_URL}';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      // Verify token is still valid
      axios.get(`${API_URL}/api/user-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setUser({ username, token });
          setIsLoggedIn(true);
        })
        .catch(() => {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/login`, { username, password });
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      setUser({ username, token });
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, password, email, phoneNumber) => {
    setError('');
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/register`, { 
        username, 
        password, 
        email, 
        phoneNumber 
      });
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const value = {
    isLoggedIn,
    user,
    loading,
    error,
    login,
    register,
    logout,
    getAuthHeaders,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
