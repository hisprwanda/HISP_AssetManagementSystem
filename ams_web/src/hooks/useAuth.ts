import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user } = context;

  const isAdmin =
    user?.role === 'SYSTEM_ADMIN' ||
    [
      'Admin and Finance',
      'Admin & Finance',
      'Admin and Finance Directorate',
    ].includes(user?.department?.name || '') ||
    [
      'Admin and Finance Director',
      'Finance Officer',
      'Operations Officer',
    ].includes(user?.role || '');

  return { ...context, isAdmin };
};
