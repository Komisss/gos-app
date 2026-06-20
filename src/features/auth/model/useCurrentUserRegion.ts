import { useQuery } from '@tanstack/react-query';

import { getUserById } from '@/entities/user/api/users';
import { useAuth } from './AuthContext';

export function useCurrentUserRegion() {
  const { session } = useAuth();
  const isRegionalManager = session?.role?.code === 'regional_manager';
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
