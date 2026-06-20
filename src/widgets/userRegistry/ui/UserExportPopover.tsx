import type { Dispatch, SetStateAction } from 'react';
import { Download } from 'lucide-react';

import type { UserFilters } from '@/entities/user/api/users';
import { userRoleFilterOptions } from '@/entities/user/model/roleOptions';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { emptyUserExportFilters } from '../model/useUserExport';

type UserExportPopoverProps = {
  filters: UserFilters;
  exportFilters: UserFilters;
  exportPending: boolean;
  exportError: boolean;
  open: boolean;
  orgUnits: Array<{ id: number; name: string; depth: number }>;
  regions: Array<{ id: number; name: string }>;
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
  onDownload,
  onExportFiltersChange,
  onOpenChange,
}: UserExportPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" className="bg-[#6d79ea] text-white hover:bg-[#5c67d9]">
          <Download />
          Скачать XLSX
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
            <ExportDateFilter
              label="Создан от"
              value={exportFilters.created_from}
              onChange={(created_from) => onExportFiltersChange((current) => ({ ...current, created_from }))}
            />
            <ExportDateFilter
              label="Создан до"
              value={exportFilters.created_to}
              onChange={(created_to) => onExportFiltersChange((current) => ({ ...current, created_to }))}
            />
            <FilterSearchSelect
              label="Структура подчинения"
              value={exportFilters.org_unit}
              placeholder="Все структуры подчинения"
              searchPlaceholder="Поиск структуры подчинения"
              options={orgUnits.map((orgUnit) => ({
                value: String(orgUnit.id),
                label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
              }))}
              onChange={(org_unit) => onExportFiltersChange((current) => ({ ...current, org_unit }))}
            />
            <FilterSearchSelect
              label="Регион"
              value={exportFilters.region}
              placeholder="Все регионы"
              searchPlaceholder="Поиск региона"
              options={regions.map((region) => ({ value: String(region.id), label: region.name }))}
              onChange={(region) => onExportFiltersChange((current) => ({ ...current, region }))}
            />
            <ExportSelect
              label="Роль"
              value={exportFilters.role}
              placeholder="Все"
              options={userRoleFilterOptions}
              onChange={(role) => onExportFiltersChange((current) => ({ ...current, role }))}
            />
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-slate-500 !mb-1">Статус</p>
              <Select
                value={exportFilters.status || 'all'}
                onValueChange={(status) =>
                  onExportFiltersChange((current) => ({ ...current, status: status === 'all' ? '' : status }))
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

          {exportError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Не удалось скачать файл пользователей.
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => onExportFiltersChange(emptyUserExportFilters)}>
              Сбросить
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onExportFiltersChange(filters)}>
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

function ExportDateFilter({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
    </div>
  );
}

function ExportSelect({
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
