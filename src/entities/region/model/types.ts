export type RegionDto = {
  id: number;
  name: string;
  code: string;
  external_code?: number | null;
  is_active: boolean;
};

export type Region = {
  id: number;
  name: string;
  code: string;
  externalCode: number | null;
  isActive: boolean;
};
