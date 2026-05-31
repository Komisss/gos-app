import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ListFilter, UserPlus } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import { getUsersPage, type UserFilters } from '@/entities/user/api/users';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
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

const emptyRegions: Awaited<ReturnType<typeof getRegions>> = [];
const emptyOrgUnits: Awaited<ReturnType<typeof getOrgUnitsTree>> = [];

type UserRegistryProps = {
  title?: string;
  initialFilters?: UserFilters;
  showActions?: boolean;
  showFilterCard?: boolean;
  showTableFilters?: boolean;
  tableFilterMode?: 'all' | 'region' | 'none';
};

export function UserRegistry({
  title = 'Список пользователей',
  initialFilters = {},
  showActions = true,
  showFilterCard = true,
  showTableFilters = true,
  tableFilterMode,
}: UserRegistryProps = {}) {
  const resolvedTableFilterMode = tableFilterMode ?? (showTableFilters ? 'all' : 'none');
  const initialUserFilters = useMemo(
    () => ({
      ...emptyUserFilters,
      ...initialFilters,
    }),
    [initialFilters],
  );
  const [filters, setFilters] = useState<UserFilters>(initialUserFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(filters.search ?? '', 500);
  const userExport = useUserExport();
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [debouncedSearch, filters],
  );

  const usersQuery = useQuery({
    queryKey: ['users', queryFilters, page, pageSize],
    queryFn: () => getUsersPage(queryFilters, page, pageSize),
    placeholderData: keepPreviousData,
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const usersPage = usersQuery.data;
  const users = usersPage?.items ?? [];
  const total = usersPage?.total ?? 0;
  const hasMore = usersPage?.hasMore ?? false;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const regions = regionsQuery.data ?? emptyRegions;
  const orgUnits = orgUnitsQuery.data ?? emptyOrgUnits;

  const updateFilters = useCallback((patch: UserFilters) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const changePageSize = useCallback((nextPageSize: number) => {
    setPage(1);
    setPageSize(nextPageSize);
  }, []);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold !text-slate-900">{title}</h1>
            <div className="space-y-1 text-sm text-slate-500">
              <p>Итого</p>
              <p className="text-base font-semibold text-slate-900">{total}</p>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-wrap gap-2">
              {showFilterCard && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 bg-white"
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  <ListFilter />
                  Фильтры
                </Button>
              )}
              <Button asChild className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
                <Link to="/users/new">
                  <UserPlus />
                  Добавить пользователя
                </Link>
              </Button>
              <UserExportPopover
                filters={queryFilters}
                exportFilters={userExport.exportFilters}
                exportPending={userExport.exportPending}
                exportError={userExport.exportError}
                open={userExport.exportOpen}
                orgUnits={orgUnits}
                regions={regions}
                onDownload={userExport.runExport}
                onExportFiltersChange={userExport.setExportFilters}
                onOpenChange={userExport.setExportOpen}
              />
            </div>
          )}
        </div>

        {showFilterCard && filtersOpen && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterInput
                label="Создан от"
                type="datetime"
                value={filters.created_from}
                onChange={(created_from) => updateFilters({ created_from })}
              />
              <FilterInput
                label="Создан до"
                type="datetime"
                value={filters.created_to}
                onChange={(created_to) => updateFilters({ created_to })}
              />
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  setFilters(initialUserFilters);
                }}
              >
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
          <>
            <UserRegistryTable
              users={users}
              filters={filters}
              orgUnits={orgUnits}
              regions={regions}
              tableFilterMode={resolvedTableFilterMode}
              onFiltersChange={updateFilters}
              onRegionClick={(region) => updateFilters({ region: String(region.id) })}
            />
            <UserPagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              hasMore={hasMore}
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}

function UserPagination({
  page,
  pageSize,
  total,
  totalPages,
  hasMore,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (!pageInput.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextPage = clampPage(Number(pageInput) || 1, totalPages);

      if (nextPage !== page) {
        onPageChange(nextPage);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [onPageChange, page, pageInput, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Назад
        </Button>
        <span className="text-sm text-slate-500">
          Страница
        </span>
        <Input
          className="h-9 w-20 border-slate-200 bg-white text-sm"
          min={1}
          max={totalPages}
          type="number"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
        />
        <span className="text-sm text-slate-500">из {totalPages}</span>
        <Button
          type="button"
          variant="outline"
          disabled={!hasMore}
          onClick={() => onPageChange(page + 1)}
        >
          Вперед
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">Всего: {total}</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-9 w-24 border-slate-200 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(totalPages, 1));
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

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}
