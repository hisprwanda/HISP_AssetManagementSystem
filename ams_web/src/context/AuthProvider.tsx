import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

import { AuthContext, User } from './AuthContext';

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem('hisp_token'),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('hisp_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Cleanup legacy localStorage items if they exist
    localStorage.removeItem('hisp_token');
    localStorage.removeItem('hisp_user');

    if (token) {
      sessionStorage.setItem('hisp_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      sessionStorage.removeItem('hisp_token');
      sessionStorage.removeItem('hisp_user');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    setUser(userData);
    sessionStorage.setItem('hisp_user', JSON.stringify(userData));
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
