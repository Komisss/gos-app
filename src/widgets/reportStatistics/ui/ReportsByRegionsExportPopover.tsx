import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Download, Search } from 'lucide-react';

import type {
  DashboardPeriodType,
  ReportsByRegionsPayload,
} from '@/entities/analytics/model/types';
import { createReportsByRegionsExport } from '@/entities/export/api/exports';
import type {
  ExportCreateResponse,
  ReportsByRegionsExportFilters,
} from '@/entities/export/model/types';
import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  tableFilters: ReportsByRegionsPayload;
  regionOptions: SelectOption[];
  orgUnitOptions: SelectOption[];
  taskOptions: SelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const regionsExportColumns = [
  'region_id',
  'region_name',
  'total_assignments',
  'assignments_with_reports',
  'accepted_reports',
  'under_review_reports',
  'revision_requested_reports',
  'not_completed_assignments',
  'overdue_assignments',
  'completion_rate',
  'report_submission_rate',
  'not_completed_rate',
  'overdue_rate',
];

export function ReportsByRegionsExportPopover({
  tableFilters,
  regionOptions,
  orgUnitOptions,
  taskOptions,
  periodTypeOptions,
  taskTypeOptions,
  taskScopeOptions,
  reportTypeOptions,
  onExportStarted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ReportsByRegionsExportFilters>(() =>
    createEmptyExportFilters(),
  );

  const exportMutation = useMutation({
    mutationFn: () =>
      createReportsByRegionsExport({
        exportType: 'analytics_by_regions',
        format: 'xlsx',
        filters,
        columns: regionsExportColumns,
        asyncMode: true,
      }),
    onSuccess: (job) => {
      onExportStarted(job);
      setOpen(false);
    },
  });

  function updateFilters(patch: Partial<ReportsByRegionsExportFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-fit border-slate-200 bg-white">
          <Download />
          Экспорт XLSX
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(920px,calc(100vw-3rem))] p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Экспорт статистики по регионам</h3>
            <p className="mt-1 text-xs text-slate-500">
              Фильтры экспорта открываются пустыми. Можно заполнить их вручную или перенести фильтры
              таблицы.
            </p>
          </div>

          <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-4">
            <DateFilter
              label="Дата с"
              value={filters.date_from}
              onChange={(date_from) => updateFilters({ date_from })}
            />
            <DateFilter
              label="Дата по"
              value={filters.date_to}
              onChange={(date_to) => updateFilters({ date_to })}
            />
            <FilterSelect
              label="Тип периода"
              value={filters.period_type}
              options={periodTypeOptions}
              onChange={(period_type) =>
                updateFilters({ period_type: period_type as DashboardPeriodType })
              }
            />
            <MultiSearchSelect
              label="Регионы"
              values={filters.region_ids.map(String)}
              placeholder="Все регионы"
              searchPlaceholder="Поиск региона"
              options={regionOptions}
              onChange={(region_ids) => updateFilters({ region_ids: toNumbers(region_ids) })}
            />
            <MultiSearchSelect
              label="Структуры подчинения"
              values={filters.org_unit_ids.map(String)}
              placeholder="Все структуры подчинения"
              searchPlaceholder="Поиск структуры подчинения"
              options={orgUnitOptions}
              onChange={(org_unit_ids) => updateFilters({ org_unit_ids: toNumbers(org_unit_ids) })}
            />
            <MultiSearchSelect
              label="Задачи"
              values={filters.task_ids.map(String)}
              placeholder="Все задачи"
              searchPlaceholder="Поиск по id или названию"
              options={taskOptions}
              onChange={(task_ids) => updateFilters({ task_ids: toNumbers(task_ids) })}
            />
            <MultiSelect
              label="Тип задачи"
              values={filters.task_types}
              placeholder="Все типы"
              options={taskTypeOptions}
              onChange={(task_types) =>
                updateFilters({ task_types: task_types as ReportTaskType[] })
              }
            />
            <MultiSelect
              label="Масштаб задачи"
              values={filters.task_scope}
              placeholder="Любой масштаб"
              options={taskScopeOptions}
              onChange={(task_scope) =>
                updateFilters({ task_scope: task_scope as ReportTaskScope[] })
              }
            />
            <MultiSelect
              label="Тип отчета"
              values={filters.report_types}
              placeholder="Все типы отчетов"
              options={reportTypeOptions}
              onChange={(report_types) =>
                updateFilters({ report_types: report_types as ReportType[] })
              }
            />
            <FilterSelect
              label="Сортировка"
              value={filters.sort_by}
              options={[
                { value: 'not_completed_rate', label: 'Доля невыполненных' },
                { value: 'completion_rate', label: 'Выполнение' },
              ]}
              onChange={(sort_by) =>
                updateFilters({ sort_by: sort_by as ReportsByRegionsExportFilters['sort_by'] })
              }
            />
            <FilterSelect
              label="Направление"
              value={filters.sort_direction}
              options={[
                { value: 'desc', label: 'По убыванию' },
                { value: 'asc', label: 'По возрастанию' },
              ]}
              onChange={(sort_direction) =>
                updateFilters({ sort_direction: sort_direction as 'asc' | 'desc' })
              }
            />
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
            <BooleanFilter
              label="Включать архивные задачи"
              checked={filters.include_archived_tasks}
              onChange={(include_archived_tasks) => updateFilters({ include_archived_tasks })}
            />
            <BooleanFilter
              label="Включать удаленные назначения"
              checked={filters.include_removed_assignments}
              onChange={(include_removed_assignments) =>
                updateFilters({ include_removed_assignments })
              }
            />
            <BooleanFilter
              label="Только текущая версия отчета"
              checked={filters.only_current_report_version}
              onChange={(only_current_report_version) =>
                updateFilters({ only_current_report_version })
              }
            />
          </div>

          {exportMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Не удалось запустить экспорт.
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters(createEmptyExportFilters())}
            >
              Сбросить
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters(toExportFilters(tableFilters))}
              >
                Перенести фильтры таблицы
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate()}
              >
                {exportMutation.isPending ? 'Запускаем...' : 'Экспортировать'}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function createEmptyExportFilters(): ReportsByRegionsExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'assignment_created',
    region_ids: [],
    org_unit_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
    sort_by: 'completion_rate',
    sort_direction: 'desc',
  };
}

function toExportFilters(filters: ReportsByRegionsPayload): ReportsByRegionsExportFilters {
  const {
    page: _page,
    page_size: _pageSize,
    assignment_statuses: _assignmentStatuses,
    ...exportFilters
  } = filters;
  return exportFilters;
}

function MultiSearchSelect({
  label,
  values,
  placeholder,
  searchPlaceholder,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  searchPlaceholder: string;
  options: SelectOption[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  function toggleValue(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"
          >
            <span className="min-w-0 truncate">
              {selectedOptions.length ? `Выбрано: ${selectedOptions.length}` : placeholder}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(520px,calc(100vw-3rem))] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 border-slate-200 pl-9 text-sm"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(options.map((option) => option.value))}
            >
              Выбрать все
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
              Очистить
            </Button>
          </div>
          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Ничего не найдено.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => toggleValue(option.value)}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 text-[#465cd3]',
                        values.includes(option.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{option.label}</span>
                      {option.description && (
                        <span className="block text-xs text-slate-500">{option.description}</span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MultiSelect({
  label,
  values,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"
          >
            <span className="min-w-0 truncate">
              {values.length ? `Выбрано: ${values.length}` : placeholder}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(360px,calc(100vw-3rem))] p-2">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() =>
                  onChange(
                    values.includes(option.value)
                      ? values.filter((value) => value !== option.value)
                      : [...values, option.value],
                  )
                }
              >
                <Check
                  className={cn(
                    'size-4 text-[#465cd3]',
                    values.includes(option.value) ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="font-medium text-slate-900">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full border-slate-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
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

function BooleanFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function toNumbers(values: string[]) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}
