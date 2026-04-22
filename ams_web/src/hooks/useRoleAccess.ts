import { useAuth } from './useAuth';

export function useRoleAccess() {
  const { user } = useAuth();

  let portal = 'STAFF';
  let isAdmin = false;
  let isCEO = false;
  let isHOD = false;
  let isStaff = true;

  if (user) {
    const dept = user.department?.name;
    const role = user.role;

    if (
      dept === 'Admin and Finance' &&
      (role === 'Admin and Finance Director' || role === 'Finance Officer')
    ) {
      portal = 'ADMIN';
    } else if (dept === 'Admin and Finance' && role === 'Operations Officer') {
      portal = 'STAFF';
    } else if (dept === 'Office of the CEO' && role === 'HOD') {
      portal = 'CEO';
    } else if (role === 'HOD') {
      portal = 'HOD';
    }

    isAdmin = portal === 'ADMIN';
    isCEO = portal === 'CEO';
    isHOD = portal === 'HOD';
    isStaff = portal === 'STAFF';
  }

  return {
    portal,
    isAdmin,
    isCEO,
    isHOD,
    isStaff,
  };
}
