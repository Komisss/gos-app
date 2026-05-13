import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListFilter, UserPlus } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import {
  activateUser,
  deactivateUser,
  getUsers,
  type UserFilters,
} from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useUserExport } from '../model/useUserExport';
import { UserExportPopover } from './UserExportPopover';
import { UserRegistryTable } from './UserRegistryTable';

const emptyUserFilters: UserFilters = {
  created_from: '',
  created_to: '',
  org_unit: '',
  region: '',
  role: '',
  search: '',
  status: '',
};

export function UserRegistry() {
  const queryClient = useQueryClient();
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [filters, setFilters] = useState<UserFilters>(emptyUserFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const userExport = useUserExport();

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserListItem) => (user.active ? deactivateUser(user.id) : activateUser(user.id)),
    onMutate: (user) => setTogglingUserId(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onSettled: () => setTogglingUserId(null),
  });

  const users = usersQuery.data ?? [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold !text-slate-900">Список пользователей</h1>
            <div className="space-y-1 text-sm text-slate-500">
              <p>Итого</p>
              <p className="text-base font-semibold text-slate-900">{users.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <ListFilter />
              Фильтры
            </Button>
            <Button asChild className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
              <Link to="/users/new">
                <UserPlus />
                Добавить пользователя
              </Link>
            </Button>
            <UserExportPopover
              filters={filters}
              exportFilters={userExport.exportFilters}
              exportPending={userExport.exportPending}
              exportError={userExport.exportError}
              open={userExport.exportOpen}
              orgUnits={orgUnitsQuery.data ?? []}
              regions={regionsQuery.data ?? []}
              onDownload={userExport.runExport}
              onExportFiltersChange={userExport.setExportFilters}
              onOpenChange={userExport.setExportOpen}
            />
          </div>
        </div>

        {filtersOpen && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 !mb-1">Поиск</p>
                <Input
                  className="h-9 border-slate-200 text-sm"
                  placeholder="ФИО, логин"
                  value={filters.search ?? ''}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <FilterInput
                label="Создан от"
                type="datetime"
                value={filters.created_from}
                onChange={(created_from) => setFilters((current) => ({ ...current, created_from }))}
              />
              <FilterInput
                label="Создан до"
                type="datetime"
                value={filters.created_to}
                onChange={(created_to) => setFilters((current) => ({ ...current, created_to }))}
              />
              <FilterSearchSelect
                label="Оргструктура"
                value={filters.org_unit}
                placeholder="Все оргструктуры"
                searchPlaceholder="Поиск оргструктуры"
                options={(orgUnitsQuery.data ?? []).map((orgUnit) => ({
                  value: String(orgUnit.id),
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                }))}
                onChange={(org_unit) => setFilters((current) => ({ ...current, org_unit }))}
              />
              <FilterSearchSelect
                label="Регион"
                value={filters.region}
                placeholder="Все регионы"
                searchPlaceholder="Поиск региона"
                options={(regionsQuery.data ?? []).map((region) => ({
                  value: String(region.id),
                  label: region.name,
                }))}
                onChange={(region) => setFilters((current) => ({ ...current, region }))}
              />
              <FilterSelect
                label="Роль"
                value={filters.role}
                placeholder="Все"
                options={[
                  { value: '1', label: 'Региональный' },
                  { value: '2', label: 'Федеральный' },
                ]}
                onChange={(role) => setFilters((current) => ({ ...current, role }))}
              />
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-slate-500 !mb-1">Статус</p>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(status) =>
                    setFilters((current) => ({ ...current, status: status === 'all' ? '' : status }))
                  }
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                    <SelectItem value="deactivated">Деактивирован</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setFilters(emptyUserFilters)}>
                Сбросить фильтры
              </Button>
            </div>
          </div>
        )}

        {usersQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем пользователей...
          </div>
        ) : usersQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить список пользователей.
          </div>
        ) : (
          <UserRegistryTable
            users={users}
            togglingUserId={togglingUserId}
            onToggleActive={(user) => toggleActiveMutation.mutate(user)}
          />
        )}
      </div>
    </div>
  );
}

function FilterInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: 'number' | 'datetime';
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      {type === 'datetime' ? (
        <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
      ) : (
        <Input
          type="number"
          className="h-9 border-slate-200 text-sm"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Select value={value || 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? '' : nextValue)}>
        <SelectTrigger className="w-full border-slate-200 bg-white">
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
    </div>
  );
}
