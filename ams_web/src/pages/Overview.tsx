import { useRoleAccess } from '../hooks/useRoleAccess';
import { AdminOverview } from './AdminOverview';
import { StaffOverview } from './StaffOverview';
import { HODOverview } from './HODOverview';
import { CEOOverview } from './CEOOverview';

export const Overview = () => {
  const { isAdmin, isHOD, isCEO } = useRoleAccess();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {isCEO ? (
        <CEOOverview />
      ) : isAdmin ? (
        <AdminOverview />
      ) : isHOD ? (
        <HODOverview />
      ) : (
        <StaffOverview />
      )}
    </div>
  );
};
