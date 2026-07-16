import type { UserRole } from '@/entities/user/model/types';
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';

export function isManagementRole(role: UserRole | null) {
  return (
    role?.code === 'federal_manager' ||
    role?.code === 'regional_manager' ||
    role?.id === USER_ROLE_IDS.federalManager ||
    role?.id === USER_ROLE_IDS.regionalManager
  );
}
