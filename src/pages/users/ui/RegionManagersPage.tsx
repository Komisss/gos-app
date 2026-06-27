import { Navigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/model/AuthContext';
import { UserRegistry } from '@/widgets/userRegistry/ui/UserRegistry';

const regionalManagerFilters = {
  roles: '2',
};

export default function RegionManagersPage() {
  const { session } = useAuth();
  const isFederalManager = session?.role?.code === 'federal_manager' || session?.role?.id === 1;

  if (!isFederalManager) {
    return <Navigate to="/" replace />;
  }

  return (
    <UserRegistry
      title="Регионы с управляющими"
      initialFilters={regionalManagerFilters}
      showActions={false}
      tableFilterMode="region"
    />
  );
}
