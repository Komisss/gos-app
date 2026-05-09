export type OrgUnitDto = {
  id: number;
  name: string;
  parent_id: number | null;
  region_id: number | null;
  children: Array<OrgUnitDto | string>;
};

export type OrgUnit = {
  id: number;
  name: string;
  parentId: number | null;
  regionId: number | null;
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
