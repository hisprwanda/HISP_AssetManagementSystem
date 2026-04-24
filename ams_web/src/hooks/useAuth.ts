import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user } = context;

  const role = user?.role || '';
  const deptName = user?.department?.name || '';

  const roleUpper = role.toUpperCase();
  const deptUpper = deptName.toUpperCase();

  const isFinanceAdmin =
    roleUpper.includes('SYSTEM_ADMIN') ||
    roleUpper.includes('ADMIN') ||
    roleUpper.includes('FINANCE') ||
    deptUpper.includes('ADMIN AND FINANCE') ||
    deptUpper.includes('ADMIN & FINANCE') ||
    deptUpper.includes('FINANCE');

  const isHOD = roleUpper.includes('HOD') || roleUpper.includes('HEAD OF');

  const isCEO =
    roleUpper === 'CEO' || (deptUpper.includes('OFFICE OF THE CEO') && isHOD);
  const isStaff =
    roleUpper.includes('STAFF') || (!isFinanceAdmin && !isHOD && !isCEO);

  const isAdmin = isFinanceAdmin;

  return {
    ...context,
    isAdmin,
    isFinanceAdmin,
    isHOD,
    isCEO,
    isStaff,
  };
};
