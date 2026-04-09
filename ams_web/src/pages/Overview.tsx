import { useAuth } from '../hooks/useAuth';
import { AdminOverview } from './AdminOverview';
import { StaffOverview } from './StaffOverview';
import { HODOverview } from './HODOverview';

export const Overview = () => {
  const { isAdmin, isHOD } = useAuth();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {isAdmin ? (
        <AdminOverview />
      ) : isHOD ? (
        <HODOverview />
      ) : (
        <StaffOverview />
      )}
    </div>
  );
};
