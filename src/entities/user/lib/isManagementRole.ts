import type { UserRole } from '@/entities/user/model/types';

export function isManagementRole(role: UserRole | null) {
  return (
    role?.code === 'federal_manager' ||
    role?.code === 'regional_manager' ||
    role?.id === 1 ||
    role?.id === 2
  );
}
