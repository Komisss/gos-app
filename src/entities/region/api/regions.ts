import { http } from '@/shared/api/http';
import type { Region, RegionDto } from '@/entities/region/model/types';

const REGIONS_ENDPOINT = '/api/v1/regions';

export async function getRegions() {
  const response = await http<RegionDto[]>(REGIONS_ENDPOINT);

  return response.map(mapRegionDto);
}

function mapRegionDto(region: RegionDto): Region {
  return {
    id: region.id,
    name: region.name,
    code: region.code,
    isActive: region.is_active,
  };
}
