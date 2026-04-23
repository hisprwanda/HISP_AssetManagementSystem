import React, { useState, useEffect } from 'react';
import { AuthContext, User } from './AuthContext';

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('hisp_token'),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hisp_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('hisp_token', token);
    } else {
      localStorage.removeItem('hisp_token');
      localStorage.removeItem('hisp_user');
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('hisp_user', JSON.stringify(userData));
    localStorage.setItem('hisp_token', newToken);
    setUser(userData);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('hisp_token');
    localStorage.removeItem('hisp_user');
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
