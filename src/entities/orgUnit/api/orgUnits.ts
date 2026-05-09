import { http } from '@/shared/api/http';
import type { CreateOrgUnitPayload, OrgUnit, OrgUnitDto } from '@/entities/orgUnit/model/types';

const ORG_UNITS_ENDPOINT = '/api/v1/org-units';
const ORG_UNITS_TREE_ENDPOINT = '/api/v1/org-units/tree';

type OrgUnitsTreeResponse = OrgUnitDto | OrgUnitDto[];

export async function getOrgUnitsTree() {
  const response = await http<OrgUnitsTreeResponse>(ORG_UNITS_TREE_ENDPOINT);

  return flattenOrgUnits(Array.isArray(response) ? response : [response]);
}

export async function createOrgUnit(payload: CreateOrgUnitPayload) {
  return http<OrgUnitDto>(ORG_UNITS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function flattenOrgUnits(items: OrgUnitDto[], depth = 0): OrgUnit[] {
  return items.flatMap((item) => {
    const children = Array.isArray(item.children)
      ? item.children.filter((child): child is OrgUnitDto => typeof child === 'object' && child !== null)
      : [];

    return [
      {
        id: item.id,
        name: item.name,
        parentId: item.parent_id,
        regionId: item.region_id,
        depth,
      },
      ...flattenOrgUnits(children, depth + 1),
    ];
  });
}
