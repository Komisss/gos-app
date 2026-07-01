import type { OrgUnit } from '@/entities/orgUnit/model/types';

export function filterOrgUnitsForUserRole(
  orgUnits: OrgUnit[],
  roleId: number | null,
  regionId: number | null,
) {
  if (!roleId || !regionId || roleId === 1 || roleId === 2) {
    return [];
  }

  const targetHeadRoleCodes = getOrgUnitHeadRoleCodesForUserRole(roleId);

  return orgUnits.filter((orgUnit) => {
    if (
      orgUnit.regionId !== regionId ||
      orgUnit.isActive === false ||
      orgUnit.headUser?.status !== 'active'
    ) {
      return false;
    }

    if (targetHeadRoleCodes.length === 0) {
      return true;
    }

    return targetHeadRoleCodes.includes(orgUnit.headUser?.role?.code ?? '');
  });
}

export function getOrgUnitHeadRoleCodesForUserRole(roleId: number) {
  if (roleId === 4) {
    return ['federal_manager', 'regional_manager'];
  }

  if (roleId === 5 || roleId === 6) {
    return ['main_manager'];
  }

  if (roleId === 7) {
    return ['unit_head'];
  }

  if (roleId === 8) {
    return ['department_head'];
  }

  return [];
}

export function getAutoLockedOrgUnitForUserRole(
  orgUnits: OrgUnit[],
  roleId: number | null,
  regionId: number | null,
) {
  if (roleId !== 4 || !regionId) {
    return null;
  }

  const regionalManagerOrgUnits = orgUnits.filter(
    (orgUnit) =>
      orgUnit.regionId === regionId &&
      orgUnit.isActive !== false &&
      orgUnit.headUser?.status === 'active' &&
      orgUnit.headUser?.role?.code === 'regional_manager',
  );

  return regionalManagerOrgUnits.length === 1 ? regionalManagerOrgUnits[0] : null;
}
