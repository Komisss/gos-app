import { memo } from 'react';

import { getUserStatusLabel, type UserFilters } from '@/entities/user/api/users';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import type { Region } from '@/entities/region/model/types';
import type { UserListItem } from '@/entities/user/model/types';
import { Badge } from '@/shared/ui/badge';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

type Props = {
  users: UserListItem[];
  filters: UserFilters;
  orgUnits: OrgUnit[];
  regions: Region[];
  showFilters?: boolean;
  onFiltersChange: (filters: UserFilters) => void;
};

const roleOptions = [
  { value: '2', label: 'Региональный' },
  { value: '1', label: 'Федеральный' },
];

const statusOptions = [
  { value: 'active', label: 'Активен' },
  { value: 'inactive', label: 'Неактивен' },
  { value: 'deactivated', label: 'Деактивирован' },
];

export const UserRegistryTable = memo(function UserRegistryTable({
  users,
  filters,
  orgUnits,
  regions,
  showFilters = true,
  onFiltersChange,
}: Props) {
  return (
    <TableScrollArea headerHeight={showFilters ? '5rem' : '3rem'} height="68vh">
      <Table className="min-w-[1040px] whitespace-nowrap">
        <UserRegistryTableHeader
          filters={filters}
          orgUnits={orgUnits}
          regions={regions}
          showFilters={showFilters}
          onFiltersChange={onFiltersChange}
        />
        <UserRegistryTableBody users={users} />
      </Table>
    </TableScrollArea>
  );
});

const UserRegistryTableHeader = memo(function UserRegistryTableHeader({
  filters,
  orgUnits,
  regions,
  showFilters,
  onFiltersChange,
}: {
  filters: UserFilters;
  orgUnits: OrgUnit[];
  regions: Region[];
  showFilters: boolean;
  onFiltersChange: (filters: UserFilters) => void;
}) {
  return (
    <TableHeader>
      {showFilters && <TableRow className="border-b-slate-200 bg-white hover:bg-white">
        <TableHead className="w-24" />
        <TableHead className="min-w-[240px] align-bottom">
          <HeaderSearchInput
            value={filters.search ?? ''}
            onChange={(search) => onFiltersChange({ search })}
          />
        </TableHead>
        <TableHead className="min-w-[180px] align-bottom">
          <HeaderSelect
            value={filters.role}
            placeholder="Все роли"
            options={roleOptions}
            onChange={(role) => onFiltersChange({ role })}
          />
        </TableHead>
        <TableHead className="min-w-[220px] align-bottom">
          <FilterSearchSelect
            label=""
            value={filters.region}
            placeholder="Все регионы"
            searchPlaceholder="Поиск региона"
            options={regions.map((region) => ({
              value: String(region.id),
              label: region.name,
            }))}
            onChange={(region) => onFiltersChange({ region })}
          />
        </TableHead>
        <TableHead className="min-w-[220px] align-bottom">
          <FilterSearchSelect
            label=""
            value={filters.org_unit}
            placeholder="Все оргструктуры"
            searchPlaceholder="Поиск оргструктуры"
            options={orgUnits.map((orgUnit) => ({
              value: String(orgUnit.id),
              label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
            }))}
            onChange={(org_unit) => onFiltersChange({ org_unit })}
          />
        </TableHead>
        <TableHead className="w-32 align-bottom">
          <HeaderSelect
            value={filters.status}
            placeholder="Все статусы"
            options={statusOptions}
            onChange={(status) => onFiltersChange({ status })}
          />
        </TableHead>
      </TableRow>}
      <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
        <TableHead className="w-24">#</TableHead>
        <TableHead className="min-w-[240px]">Пользователь</TableHead>
        <TableHead className="min-w-[180px]">Роль</TableHead>
        <TableHead className="min-w-[220px]">Регион</TableHead>
        <TableHead className="min-w-[220px]">Оргструктура</TableHead>
        <TableHead className="w-32">Статус</TableHead>
      </TableRow>
    </TableHeader>
  );
});

const UserRegistryTableBody = memo(function UserRegistryTableBody({ users }: { users: UserListItem[] }) {
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
            className={`cursor-pointer align-top border-b-slate-200 hover:bg-slate-50/60 ${
              index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
            }`}
            onClick={() => openInNewTab(`/users/${user.id}`)}
          >
            <TableCell className="text-slate-700">{user.id}</TableCell>
            <TableCell className="min-w-[240px]">
              <div className="space-y-1 whitespace-normal">
                <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                <div className="text-xs text-slate-500">@{user.username}</div>
              </div>
            </TableCell>
            <TableCell className="text-slate-700">{user.role?.name ?? 'Не указана'}</TableCell>
            <TableCell className="text-slate-700">{user.region?.name ?? 'Не указан'}</TableCell>
            <TableCell className="min-w-[220px] whitespace-normal text-slate-700">
              {user.orgUnit?.name ?? 'Не указана'}
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

function HeaderSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? '' : nextValue)}>
      <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-sm font-normal">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function openInNewTab(path: string) {
  const openedWindow = window.open(path, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
  }
}
