export type OrgUnitDto = {
  id: number;
  name: string;
  type?: OrgUnitType;
  parent_id: number | null;
  region_id: number | null;
  region_name?: string | null;
  is_active?: boolean;
  head_user?: OrgUnitHeadUserDto | null;
  children: Array<OrgUnitDto | string>;
};

export type OrgUnitHeadUserDto = {
  user_id: number;
  full_name: string;
  username: string;
  status: string;
  role: {
    role_id: number;
    code: string;
    name: string;
  } | null;
};

export type OrgUnit = {
  id: number;
  name: string;
  type?: OrgUnitType;
  parentId: number | null;
  regionId: number | null;
  regionName?: string | null;
  isActive?: boolean;
  headUser?: OrgUnitHeadUserDto | null;
  depth: number;
};

export type OrgUnitType = 'main_branch' | 'unit' | 'department';

export type CreateOrgUnitPayload = {
  region_id: number;
  type: OrgUnitType;
  name: string;
  parent_id: number;
  head_user_id: number;
  is_active: boolean;
};
