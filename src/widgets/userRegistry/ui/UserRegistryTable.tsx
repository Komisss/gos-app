import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getUserStatusLabel,
  USER_WITHOUT_ORG_UNIT_FILTER,
  type UserFilters,
} from '@/entities/user/api/users';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import type { Region } from '@/entities/region/model/types';
import type { UserListItem, UserOrgUnit } from '@/entities/user/model/types';
import { isManagementRole } from '@/entities/user/lib/isManagementRole';
import { Badge } from '@/shared/ui/badge';
import { FilterMultiSearchSelect } from '@/shared/ui/filter-multi-search-select';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

type TableFilterMode = 'all' | 'region' | 'none';

type Props = {
  users: UserListItem[];
  filters: UserFilters;
  orgUnits: OrgUnit[];
  regions: Region[];
  roleOptions: Array<{ value: string; label: string }>;
  tableFilterMode?: TableFilterMode;
  regionFilterDisabled?: boolean;
  onFiltersChange: (filters: UserFilters) => void;
  onRegionClick?: (region: Region) => void;
};

const statusOptions = [
  { value: 'active', label: 'Активен' },
  { value: 'disabled', label: 'Отключен' },
  { value: 'moderation', label: 'На модерации' },
];

export const UserRegistryTable = memo(function UserRegistryTable({
  users,
  filters,
  orgUnits,
  regions,
  roleOptions,
  tableFilterMode = 'all',
  regionFilterDisabled = false,
  onFiltersChange,
  onRegionClick,
}: Props) {
  const showFilters = tableFilterMode !== 'none';
  const navigate = useNavigate();
  const handleUserClick = useCallback((userId: number) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  return (
    <TableScrollArea headerHeight={showFilters ? '5rem' : '3rem'} height="68vh">
      <Table className="min-w-[1040px] whitespace-nowrap">
        <UserRegistryTableHeader
          filters={filters}
          orgUnits={orgUnits}
          regions={regions}
          roleOptions={roleOptions}
          tableFilterMode={tableFilterMode}
          regionFilterDisabled={regionFilterDisabled}
          onFiltersChange={onFiltersChange}
        />
        <UserRegistryTableBody users={users} onRegionClick={onRegionClick} onUserClick={handleUserClick} />
      </Table>
    </TableScrollArea>
  );
});

const UserRegistryTableHeader = memo(function UserRegistryTableHeader({
  filters,
  orgUnits,
  regions,
  roleOptions,
  tableFilterMode,
  regionFilterDisabled,
  onFiltersChange,
}: {
  filters: UserFilters;
  orgUnits: OrgUnit[];
  regions: Region[];
  roleOptions: Array<{ value: string; label: string }>;
  tableFilterMode: TableFilterMode;
  regionFilterDisabled: boolean;
  onFiltersChange: (filters: UserFilters) => void;
}) {
  const showFilters = tableFilterMode !== 'none';
  const showAllFilters = tableFilterMode === 'all';
  const selectedRegionIds = splitFilterValues(filters.region_ids).map(Number);
  const availableOrgUnits = selectedRegionIds.length
    ? orgUnits.filter((orgUnit) => selectedRegionIds.includes(orgUnit.regionId ?? 0))
    : orgUnits;

  return (
    <TableHeader>
      {showFilters && (
        <TableRow className="border-b-slate-200 bg-white hover:bg-white">
          <TableHead className="w-24" />
            <TableHead className="min-w-[220px] align-bottom">
            <FilterMultiSearchSelect
              label=""
              values={splitFilterValues(filters.region_ids)}
              disabled={regionFilterDisabled}
              placeholder="Все регионы"
              searchPlaceholder="Поиск региона"
              options={regions.map((region) => ({
                value: String(region.id),
                label: region.name,
              }))}
              onChange={(region_ids) =>
                onFiltersChange({
                  region_ids: joinFilterValues(region_ids),
                  org_unit_ids: '',
                })
              }
            />
          </TableHead>
          <TableHead className="min-w-[240px] align-bottom">
            {showAllFilters && (
              <HeaderSearchInput
                value={filters.search ?? ''}
                onChange={(search) => onFiltersChange({ search })}
              />
            )}
          </TableHead>
          <TableHead className="min-w-[180px] align-bottom">
            {showAllFilters && (
              <FilterMultiSearchSelect
                values={splitFilterValues(filters.roles)}
                placeholder="Все роли"
                searchPlaceholder="Поиск роли"
                options={roleOptions}
                onChange={(roles) => onFiltersChange({ roles: joinFilterValues(roles) })}
              />
            )}
          </TableHead>
          <TableHead className="min-w-[220px] align-bottom">
            {showAllFilters && (
              <FilterSearchSelect
                label=""
                value={filters.org_unit_ids}
                placeholder="Все структуры подчинения"
                searchPlaceholder="Поиск структуры подчинения"
                options={[
                  {
                    value: USER_WITHOUT_ORG_UNIT_FILTER,
                    label: 'Без структуры подчинения',
                  },
                  ...availableOrgUnits.map((orgUnit) => ({
                    value: String(orgUnit.id),
                    label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                    description: orgUnit.regionName ?? undefined,
                  })),
                ]}
                onChange={(org_unit_ids) => onFiltersChange({ org_unit_ids })}
              />
            )}
          </TableHead>
          <TableHead className="w-32 align-bottom">
            {showAllFilters && (
              <FilterMultiSearchSelect
                values={splitFilterValues(filters.statuses)}
                placeholder="Все статусы"
                searchPlaceholder="Поиск статуса"
                options={statusOptions}
                onChange={(statuses) => onFiltersChange({ statuses: joinFilterValues(statuses) })}
              />
            )}
          </TableHead>
        </TableRow>
      )}
      <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
        <TableHead className="w-24">#</TableHead>
        <TableHead className="min-w-[220px]">Регион</TableHead>
        <TableHead className="min-w-[240px]">Пользователь</TableHead>
        <TableHead className="min-w-[180px]">Роль</TableHead>
        <TableHead className="min-w-[220px]">Структура подчинения</TableHead>
        <TableHead className="w-32">Статус</TableHead>
      </TableRow>
    </TableHeader>
  );
});

const UserRegistryTableBody = memo(function UserRegistryTableBody({
  users,
  onRegionClick,
  onUserClick,
}: {
  users: UserListItem[];
  onRegionClick?: (region: Region) => void;
  onUserClick: (userId: number) => void;
}) {
  return (
    <TableBody>
      {users.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
            Пользователей пока нет.
          </TableCell>
        </TableRow>
      ) : (
        users.map((user, index) => (
          <TableRow
            key={user.id}
            className={`cursor-pointer align-top border-b-slate-200 ${
              index % 2 === 0 ? 'bg-white hover:bg-sky-50' : 'bg-sky-50/40 hover:bg-sky-100/70'
            }`}
            onClick={() => onUserClick(user.id)}
          >
            <TableCell className="text-slate-700">{user.id}</TableCell>
            <TableCell className="text-slate-700">
              {user.region ? (
                <button
                  type="button"
                  className="font-medium text-[#465cd3] hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRegionClick?.(user.region as Region);
                  }}
                >
                  {user.region.name}
                </button>
              ) : (
                'Не указан'
              )}
            </TableCell>
            <TableCell className="min-w-[240px]">
              <div className="space-y-1 whitespace-normal">
                <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                {isManagementRole(user.role) && (
                  <div className="text-xs text-slate-500">{user.username}</div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700">{user.role?.name ?? 'Не указана'}</TableCell>
            <TableCell className="min-w-[220px] whitespace-normal text-slate-700">
              {formatOrgUnitParent(user.orgUnit)}
            </TableCell>
            <TableCell>
              <Badge
                className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${
                  user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {getUserStatusLabel(user)}
              </Badge>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );
});

function HeaderSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      className="h-9 border-slate-200 bg-white text-sm font-normal"
      placeholder="ФИО, логин"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function splitFilterValues(value?: string) {
  return value ? value.split(',').filter(Boolean) : [];
}

function joinFilterValues(values: string[]) {
  return values.join(',');
}

function formatOrgUnitParent(orgUnit: UserOrgUnit | null) {
  if (!orgUnit) {
    return 'Не указана';
  }

  return typeof orgUnit.parent === 'object' && orgUnit.parent?.name ? orgUnit.parent.name : orgUnit.name;
}
