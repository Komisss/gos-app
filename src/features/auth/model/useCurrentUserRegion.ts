import { useQuery } from '@tanstack/react-query';

import { getUserById } from '@/entities/user/api/users';
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';
import { useAuth } from './AuthContext';

export function useCurrentUserRegion() {
  const { session } = useAuth();
  const isRegionalManager = session?.role?.id === USER_ROLE_IDS.regionalManager;
  const userQuery = useQuery({
    queryKey: ['users', session?.userId],
    queryFn: () => getUserById(session?.userId ?? 0),
    enabled: isRegionalManager && Boolean(session?.userId),
  });

  return {
    isRegionalManager,
    regionId: userQuery.data?.region?.id ?? null,
    isLoading: isRegionalManager && userQuery.isLoading,
  };
}
