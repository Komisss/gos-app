import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';

export function filterOrgUnitsForUserRole(
  orgUnits: OrgUnit[],
  roleId: number | null,
  regionId: number | null,
) {
  if (
    !roleId ||
    !regionId ||
    roleId === USER_ROLE_IDS.federalManager ||
    roleId === USER_ROLE_IDS.regionalManager
  ) {
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
  if (roleId === USER_ROLE_IDS.mainManager) {
    return ['federal_manager', 'regional_manager'];
  }

  if (roleId === USER_ROLE_IDS.assistant || roleId === USER_ROLE_IDS.unitHead) {
    return ['main_manager'];
  }

  if (roleId === USER_ROLE_IDS.departmentHead) {
    return ['unit_head'];
  }

  if (roleId === USER_ROLE_IDS.employee) {
    return ['department_head'];
  }

  return [];
}

export function getAutoLockedOrgUnitForUserRole(
  orgUnits: OrgUnit[],
  roleId: number | null,
  regionId: number | null,
) {
  if (roleId !== USER_ROLE_IDS.mainManager || !regionId) {
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
