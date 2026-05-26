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

  const isFinanceDirector = roleUpper === 'ADMIN AND FINANCE DIRECTOR';
  const isFinanceOfficer = roleUpper === 'FINANCE OFFICER';

  const isFinanceAdmin = isFinanceDirector || isFinanceOfficer;

  const isHOD =
    roleUpper.includes('HOD') ||
    roleUpper.includes('HEAD OF') ||
    isFinanceDirector;

  const isCEO =
    roleUpper === 'CEO' || (deptUpper.includes('OFFICE OF THE CEO') && isHOD);
  const isStaff =
    roleUpper.includes('STAFF') || (!isFinanceAdmin && !isHOD && !isCEO);

  const isAdmin = isFinanceAdmin || roleUpper === 'SYSTEM_ADMIN';

  return {
    ...context,
    isAdmin,
    isFinanceAdmin,
    isFinanceDirector,
    isFinanceOfficer,
    isHOD,
    isCEO,
    isStaff,
  };
};
