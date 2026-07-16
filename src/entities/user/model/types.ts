export type UserStatus = 'active' | 'disabled' | 'moderation' | 'archived' | string;

export type UserRole = {
  id: number;
  code: string;
  name: string;
};

export type UserRegion = {
  id: number;
  name: string;
};

export type OrgUnitHeadUser = {
  id: number;
  full_name: string;
  role: string;
};

export type UserOrgUnit = {
  id: number;
  name: string;
  type?: string;
  parent?: number | UserOrgUnitParent | null;
  head_user?: OrgUnitHeadUser | string | null;
};

export type UserOrgUnitParent = {
  id: number;
  name: string;
  type?: string;
  head_user?: OrgUnitHeadUser | string | null;
};

export type UserListDto = {
  id: number;
  active: boolean;
  status?: UserStatus;
  username: string;
  full_name: string;
  max_user_id?: string | null;
  role: UserRole | null;
  region: UserRegion | null;
  org_unit: UserOrgUnit | null;
};

export type UserDetailsDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole | null;
  region: UserRegion | null;
  org_unit: UserOrgUnit | null;
  head_user: OrgUnitHeadUser | string | null;
  max_user_id: string | null;
  active: boolean | string;
  phone: string | null;
  birthday: string | null;
  link_vk?: string | null;
  status: UserStatus;
  created_at: string;
};

export type UserListItem = {
  id: number;
  active: boolean;
  status: UserStatus;
  username: string;
  fullName: string;
  maxUserId?: string | null;
  role: UserRole | null;
  region: UserRegion | null;
  orgUnit: UserOrgUnit | null;
};

export type UserDetails = UserListItem & {
  headUser: OrgUnitHeadUser | string | null;
  maxUserId: string | null;
  phone: string | null;
  birthday: string | null;
  linkVk: string | null;
  createdAt: string;
};

export type UserPatchPayload = Partial<{
  role: number | null;
  region: number | null;
  org_unit: number | null;
  parent_org_unit: number | null;
  last_login: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  full_name: string;
  external_employee_id: string;
  phone: string;
  birthday: string | null;
  link_vk?: string;
  max_username: string;
  max_user_id: string;
  max_chat_id: string;
  status: UserStatus;
  deactivated_at: string | null;
  deactivation_reason: string;
  created_by: number | null;
  groups: number[];
  user_permissions: number[];
}>;

export type RegisterUserRoleId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RegisterUserPayload = {
  username?: string;
  password?: string;
  full_name: string;
  phone: string;
  birthday: string;
  link_vk?: string;
  max_user_id: number | null;
  role: RegisterUserRoleId;
  region: number | null;
  org_unit: number | null;
};
