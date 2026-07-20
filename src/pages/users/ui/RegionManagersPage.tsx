import { Navigate } from 'react-router-dom';

import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';
import { useAuth } from '@/features/auth/model/AuthContext';
import { UserRegistry } from '@/widgets/userRegistry/ui/UserRegistry';

const regionalManagerFilters = {
  roles: String(USER_ROLE_IDS.regionalManager),
};

export default function RegionManagersPage() {
  const { session } = useAuth();
  const isFederalManager = session?.role?.id === USER_ROLE_IDS.federalManager;

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
