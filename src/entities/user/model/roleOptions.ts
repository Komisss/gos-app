import type { RegisterUserRoleId, UserRole } from './types';

export const USER_ROLE_IDS = {
  federalManager: 1,
  regionalManager: 2,
  mainManager: 3,
  assistant: 4,
  unitHead: 5,
  departmentHead: 6,
  employee: 7,
} as const;

export const userRoleOptions: Array<{
  id: RegisterUserRoleId;
  label: string;
}> = [
  { id: USER_ROLE_IDS.federalManager, label: 'Федеральный руководитель' },
  { id: USER_ROLE_IDS.regionalManager, label: 'Региональный руководитель' },
  { id: USER_ROLE_IDS.mainManager, label: 'Б3' },
  { id: USER_ROLE_IDS.assistant, label: 'Помощник Б3' },
  { id: USER_ROLE_IDS.unitHead, label: 'Б2' },
  { id: USER_ROLE_IDS.departmentHead, label: 'Б1' },
  { id: USER_ROLE_IDS.employee, label: 'Активист' },
];

export function getRoleLabelById(id?: number | null) {
  return userRoleOptions.find((role) => role.id === id)?.label;
}

export function mapRolesToOptions(roles: UserRole[]) {
  return roles
    .slice()
    .sort((first, second) => first.id - second.id)
    .map((role) => ({
      id: role.id as RegisterUserRoleId,
      code: role.code,
      label: role.name || getRoleLabelById(role.id) || `Роль #${role.id}`,
    }));
}

export function mapRolesToFilterOptions(roles: UserRole[]) {
  return mapRolesToOptions(roles)
    .slice()
    .reverse()
    .map((role) => ({
      value: String(role.id),
      label: role.label,
    }));
}
