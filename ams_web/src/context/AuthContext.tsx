import { createContext } from 'react';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: { id: string; name: string } | null;
  is_temporary_password?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
