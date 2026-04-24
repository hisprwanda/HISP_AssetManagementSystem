import React, { useState, useEffect } from 'react';
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
    if (token) {
      sessionStorage.setItem('hisp_token', token);
    } else {
      sessionStorage.removeItem('hisp_token');
      sessionStorage.removeItem('hisp_user');
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    sessionStorage.setItem('hisp_user', JSON.stringify(userData));
    sessionStorage.setItem('hisp_token', newToken);
    setUser(userData);
    setToken(newToken);
  };

  const logout = () => {
    sessionStorage.removeItem('hisp_token');
    sessionStorage.removeItem('hisp_user');
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
