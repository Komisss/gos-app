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

  const targetHeadRoleIds = getOrgUnitHeadRoleIdsForUserRole(roleId);

  return orgUnits.filter((orgUnit) => {
    if (
      orgUnit.regionId !== regionId ||
      orgUnit.isActive === false ||
      orgUnit.headUser?.status !== 'active'
    ) {
      return false;
    }

    if (targetHeadRoleIds.length === 0) {
      return true;
    }

    return targetHeadRoleIds.includes(orgUnit.headUser?.role?.role_id ?? 0);
  });
}

export function getOrgUnitHeadRoleIdsForUserRole(roleId: number) {
  if (roleId === USER_ROLE_IDS.mainManager) {
    return [USER_ROLE_IDS.federalManager, USER_ROLE_IDS.regionalManager];
  }

  if (roleId === USER_ROLE_IDS.assistant || roleId === USER_ROLE_IDS.unitHead) {
    return [USER_ROLE_IDS.mainManager];
  }

  if (roleId === USER_ROLE_IDS.departmentHead) {
    return [USER_ROLE_IDS.unitHead];
  }

  if (roleId === USER_ROLE_IDS.employee) {
    return [USER_ROLE_IDS.departmentHead];
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
      orgUnit.headUser?.role?.role_id === USER_ROLE_IDS.regionalManager,
  );

  return regionalManagerOrgUnits.length === 1 ? regionalManagerOrgUnits[0] : null;
}
