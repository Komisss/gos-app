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
