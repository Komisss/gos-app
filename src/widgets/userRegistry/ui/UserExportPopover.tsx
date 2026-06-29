import type { Dispatch, SetStateAction } from 'react';
import { Download } from 'lucide-react';

import { USER_WITHOUT_ORG_UNIT_FILTER, type UserFilters } from '@/entities/user/api/users';
import { Button } from '@/shared/ui/button';
import { FilterMultiSearchSelect } from '@/shared/ui/filter-multi-search-select';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { emptyUserExportFilters } from '../model/useUserExport';

const statusOptions = [
  { value: 'active', label: 'Активен' },
  { value: 'disabled', label: 'Отключен' },
  { value: 'moderation', label: 'На модерации' },
];

type UserExportPopoverProps = {
  filters: UserFilters;
  exportFilters: UserFilters;
  exportPending: boolean;
  exportError: boolean;
  open: boolean;
  orgUnits: Array<{ id: number; name: string; depth: number }>;
  regions: Array<{ id: number; name: string }>;
  regionFilterDisabled?: boolean;
  enforcedRegionIds?: string;
  roleOptions: Array<{ value: string; label: string }>;
  onDownload: () => void;
  onExportFiltersChange: Dispatch<SetStateAction<UserFilters>>;
  onOpenChange: (open: boolean) => void;
};

export function UserExportPopover({
  filters,
  exportFilters,
  exportPending,
  exportError,
  open,
  orgUnits,
  regions,
  regionFilterDisabled = false,
  enforcedRegionIds = '',
  roleOptions,
  onDownload,
  onExportFiltersChange,
  onOpenChange,
}: UserExportPopoverProps) {
  function normalizeExportFilters(nextFilters: UserFilters): UserFilters {
    if (!regionFilterDisabled || !enforcedRegionIds) {
      return nextFilters;
    }

    return {
      ...nextFilters,
      region_ids: enforcedRegionIds,
    };
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
          <Download />
          Экспорт
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(560px,calc(100vw-2rem))] p-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Экспорт пользователей</h2>
            <p className="mt-1 text-xs text-slate-500">
              Выберите фильтры для будущей выгрузки и скачайте пользователей в Excel.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 !mb-1">Поиск</p>
              <Input
                className="h-9 border-slate-200 text-sm"
                placeholder="ФИО, логин"
                value={exportFilters.search ?? ''}
                onChange={(event) => onExportFiltersChange((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
            <FilterSearchSelect
              label="Структура подчинения"
              value={exportFilters.org_unit_ids}
              placeholder="Все структуры подчинения"
              searchPlaceholder="Поиск структуры подчинения"
              options={[
                {
                  value: USER_WITHOUT_ORG_UNIT_FILTER,
                  label: 'Без структуры подчинения',
                },
                ...orgUnits.map((orgUnit) => ({
                  value: String(orgUnit.id),
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                })),
              ]}
              onChange={(org_unit_ids) => onExportFiltersChange((current) => ({ ...current, org_unit_ids }))}
            />
            <FilterMultiSearchSelect
              label="Регион"
              values={splitFilterValues(exportFilters.region_ids)}
              disabled={regionFilterDisabled}
              placeholder="Все регионы"
              searchPlaceholder="Поиск региона"
              options={regions.map((region) => ({ value: String(region.id), label: region.name }))}
              onChange={(region_ids) =>
                onExportFiltersChange((current) => ({
                  ...current,
                  region_ids: joinFilterValues(region_ids),
                }))
              }
            />
            <FilterMultiSearchSelect
              label="Роль"
              values={splitFilterValues(exportFilters.roles)}
              placeholder="Все роли"
              searchPlaceholder="Поиск роли"
              options={roleOptions}
              onChange={(roles) =>
                onExportFiltersChange((current) => ({
                  ...current,
                  roles: joinFilterValues(roles),
                }))
              }
            />
            <div className="md:col-span-2">
              <FilterMultiSearchSelect
                label="Статус"
                values={splitFilterValues(exportFilters.statuses)}
                placeholder="Все статусы"
                searchPlaceholder="Поиск статуса"
                options={statusOptions}
                onChange={(statuses) =>
                  onExportFiltersChange((current) => ({
                    ...current,
                    statuses: joinFilterValues(statuses),
                  }))
                }
              />
            </div>
          </div>

          {exportError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Не удалось скачать файл пользователей.
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onExportFiltersChange(normalizeExportFilters(emptyUserExportFilters))}
            >
              Сбросить
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onExportFiltersChange(normalizeExportFilters(filters))}>
                Взять фильтры таблицы
              </Button>
              <Button
                type="button"
                className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
                disabled={exportPending}
                onClick={onDownload}
              >
                <Download />
                {exportPending ? 'Скачиваем...' : 'Скачать Excel'}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function splitFilterValues(value?: string) {
  return value ? value.split(',').filter(Boolean) : [];
}

function joinFilterValues(values: string[]) {
  return values.join(',');
}
