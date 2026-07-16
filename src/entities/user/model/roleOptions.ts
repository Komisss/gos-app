import type { RegisterUserRoleId } from './types';

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
  code: string;
  label: string;
}> = [
  { id: USER_ROLE_IDS.federalManager, code: 'federal_manager', label: 'Федеральный руководитель' },
  { id: USER_ROLE_IDS.regionalManager, code: 'regional_manager', label: 'Региональный руководитель' },
  { id: USER_ROLE_IDS.mainManager, code: 'main_manager', label: 'Б3' },
  { id: USER_ROLE_IDS.assistant, code: 'assistant', label: 'Помощник Б3' },
  { id: USER_ROLE_IDS.unitHead, code: 'unit_head', label: 'Б2' },
  { id: USER_ROLE_IDS.departmentHead, code: 'department_head', label: 'Б1' },
  { id: USER_ROLE_IDS.employee, code: 'employee', label: 'Активист' },
];

export const userRoleFilterOptions = userRoleOptions
  .slice()
  .reverse()
  .map((role) => ({
    value: String(role.id),
    label: role.label,
  }));

export const editableUserRoleOptions = userRoleOptions.filter(
  (role) => role.id !== USER_ROLE_IDS.federalManager,
);

export function getRoleLabelByCode(code?: string | null) {
  return userRoleOptions.find((role) => role.code === code)?.label;
}
