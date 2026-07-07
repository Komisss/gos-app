import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Download, Search } from 'lucide-react';

import { exportReports } from '@/entities/report/api/reports';
import type {
  AssignmentStatus,
  ReportSearchPayload,
  ReportStatus,
  ReportsExportResponse,
  ReportTaskScope,
  ReportTaskType,
  ReportType,
} from '@/entities/report/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useCurrentUserRegion } from '@/features/auth/model/useCurrentUserRegion';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type ExportReportStatus = 'accepted' | 'revision_requested' | 'under_review' | 'rejected';

type ExportFilters = {
  task_ids: number[];
  region_ids: number[];
  report_statuses: ReportStatus[];
  assigned_at_from: string;
  assigned_at_to: string;
  assignment_deadline_at_from: string;
  assignment_deadline_at_to: string;
  export_with_structures: boolean;
  include_without_report: boolean;
  only_current_version: boolean;
  include_removed: boolean;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
};

type Props = {
  reportFilters: ReportSearchPayload;
  regionOptions: SelectOption[];
  taskOptions?: SelectOption[];
  userOptions?: SelectOption[];
  orgUnitOptions?: SelectOption[];
  roleOptions?: SelectOption[];
  taskTypeOptions?: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions?: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions?: Array<{ value: ReportType; label: string }>;
  reportStatusOptions: Array<{ value: ReportStatus; label: string }>;
  assignmentStatusOptions?: Array<{ value: AssignmentStatus; label: string }>;
  initialFiltersFromReportFilters?: boolean;
  variant?: 'default' | 'task-details';
  onExportStarted: (job: ReportsExportResponse) => void;
};

export function ReportExportPopover({
  reportFilters,
  regionOptions,
  reportStatusOptions,
  initialFiltersFromReportFilters = false,
  variant = 'default',
  onExportStarted,
}: Props) {
  const isTaskDetailsVariant = variant === 'task-details';
  const { isRegionalManager, regionId: currentUserRegionId } = useCurrentUserRegion();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>(() =>
    initialFiltersFromReportFilters ? createExportFiltersFromReportFilters(reportFilters) : createEmptyExportFilters(),
  );

  useEffect(() => {
    if (!isRegionalManager || !currentUserRegionId) {
      return;
    }

    setFilters((current) =>
      current.region_ids.length === 1 && current.region_ids[0] === currentUserRegionId
        ? current
        : { ...current, region_ids: [currentUserRegionId] },
    );
  }, [currentUserRegionId, isRegionalManager]);

  const exportMutation = useMutation({
    mutationFn: () => {
      const payload = {
        format: 'xlsx',
        filters: {
          task_ids: filters.task_ids,
          region_ids: filters.region_ids,
          report_statuses: toExportReportStatuses(filters.report_statuses),
          assigned_at_from: filters.assigned_at_from || null,
          assigned_at_to: filters.assigned_at_to || null,
          assignment_deadline_at_from: filters.assignment_deadline_at_from || null,
          assignment_deadline_at_to: filters.assignment_deadline_at_to || null,
          ...(isTaskDetailsVariant
            ? {
                export_with_structures: filters.export_with_structures,
                include_without_report: filters.include_without_report,
              }
            : {}),
        },
        asyncMode: true,
      } as const;

      return exportReports(payload);
    },
    onSuccess: (job) => {
      onExportStarted(job);
      setOpen(false);
    },
  });

  function updateFilters(patch: Partial<ExportFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function copyTableFilters() {
    setFilters({
      task_ids: reportFilters.task_ids,
      region_ids: reportFilters.region_ids,
      report_statuses: reportFilters.report_statuses,
      assigned_at_from: '',
      assigned_at_to: '',
      assignment_deadline_at_from: '',
      assignment_deadline_at_to: '',
      export_with_structures: false,
      include_without_report: false,
      only_current_version: reportFilters.only_current_version,
      include_removed: reportFilters.include_removed,
      sort_by: reportFilters.sort_by,
      sort_direction: reportFilters.sort_direction,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-fit border-slate-200 bg-white">
          <Download />
          Экспорт XLSX
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(680px,calc(100vw-3rem))] p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Экспорт отчетов по задаче</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MultiSearchSelect
              label="Регионы"
              values={filters.region_ids.map(String)}
              placeholder="Все регионы"
              searchPlaceholder="Поиск региона"
              options={regionOptions}
              disabled={isRegionalManager}
              onChange={(region_ids) => updateFilters({ region_ids: toNumbers(region_ids) })}
            />
            <MultiSelect
              label="Статус отчета"
              values={filters.report_statuses}
              placeholder="Все статусы отчетов"
              options={reportStatusOptions}
              onChange={(report_statuses) =>
                updateFilters({ report_statuses: report_statuses as ReportStatus[] })
              }
            />
            {isTaskDetailsVariant && (
              <>
                <DateFilter
                  label="Назначено от"
                  value={filters.assigned_at_from}
                  onChange={(assigned_at_from) => updateFilters({ assigned_at_from })}
                />
                <DateFilter
                  label="Назначено до"
                  value={filters.assigned_at_to}
                  onChange={(assigned_at_to) => updateFilters({ assigned_at_to })}
                />
                <DateFilter
                  label="Дедлайн назначения от"
                  value={filters.assignment_deadline_at_from}
                  onChange={(assignment_deadline_at_from) =>
                    updateFilters({ assignment_deadline_at_from })
                  }
                />
                <DateFilter
                  label="Дедлайн назначения до"
                  value={filters.assignment_deadline_at_to}
                  onChange={(assignment_deadline_at_to) =>
                    updateFilters({ assignment_deadline_at_to })
                  }
                />
              </>
            )}
            {!isTaskDetailsVariant && (
              <>
                <FilterSelect
                  label="Сортировка"
                  value={filters.sort_by}
                  options={[
                    { value: 'submitted_at', label: 'Дата отправки' },
                    { value: 'deadline_at', label: 'Дедлайн' },
                    { value: 'created_at', label: 'Дата создания' },
                  ]}
                  onChange={(sort_by) => updateFilters({ sort_by })}
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
              </>
            )}
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
            {isTaskDetailsVariant && (
              <>
                <BooleanFilter
                  label="Выгружать со структурами"
                  checked={filters.export_with_structures}
                  onChange={(export_with_structures) =>
                    updateFilters({ export_with_structures })
                  }
                />
                <BooleanFilter
                  label="Включать без отчета"
                  checked={filters.include_without_report}
                  onChange={(include_without_report) =>
                    updateFilters({ include_without_report })
                  }
                />
              </>
            )}
            {!isTaskDetailsVariant && (
              <BooleanFilter
                label="Только текущая версия"
                checked={filters.only_current_version}
                onChange={(only_current_version) => updateFilters({ only_current_version })}
              />
            )}
          </div>

          {exportMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Не удалось запустить экспорт.
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setFilters(createEmptyExportFilters())}>
              Сбросить
            </Button>
            <div className="flex flex-wrap gap-2">
              {!isTaskDetailsVariant && (
                <Button type="button" variant="outline" onClick={copyTableFilters}>
                  Перенести фильтры таблицы
                </Button>
              )}
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

function createEmptyExportFilters(): ExportFilters {
  return {
    task_ids: [],
    region_ids: [],
    report_statuses: [],
    assigned_at_from: '',
    assigned_at_to: '',
    assignment_deadline_at_from: '',
    assignment_deadline_at_to: '',
    export_with_structures: false,
    include_without_report: false,
    only_current_version: true,
    include_removed: false,
    sort_by: 'submitted_at',
    sort_direction: 'desc',
  };
}

function createExportFiltersFromReportFilters(reportFilters: ReportSearchPayload): ExportFilters {
  return {
    task_ids: reportFilters.task_ids,
    region_ids: reportFilters.region_ids,
    report_statuses: reportFilters.report_statuses,
    assigned_at_from: '',
    assigned_at_to: '',
    assignment_deadline_at_from: '',
    assignment_deadline_at_to: '',
    export_with_structures: false,
    include_without_report: false,
    only_current_version: reportFilters.only_current_version,
    include_removed: reportFilters.include_removed,
    sort_by: reportFilters.sort_by,
    sort_direction: reportFilters.sort_direction,
  };
}

function toExportReportStatuses(statuses: ReportStatus[]): ExportReportStatus[] {
  return statuses
    .map((status) => (status === 'pending' ? 'under_review' : status))
    .filter(
      (status): status is ExportReportStatus =>
        status === 'accepted' ||
        status === 'revision_requested' ||
        status === 'under_review' ||
        status === 'rejected',
    );
}

function MultiSearchSelect({
  label,
  values,
  placeholder,
  searchPlaceholder,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  searchPlaceholder: string;
  options: SelectOption[];
  disabled?: boolean;
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
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"
          >
            <span className="min-w-0 truncate">{selectedOptions.length ? `Выбрано: ${selectedOptions.length}` : placeholder}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(520px,calc(100vw-3rem))] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 border-slate-200 pl-9 text-sm" placeholder={searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(options.map((option) => option.value))}>
              Выбрать все
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
              Очистить
            </Button>
          </div>
          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">Ничего не найдено.</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => toggleValue(option.value)}
                  >
                    <Check className={cn('mt-0.5 size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{option.label}</span>
                      {option.description && <span className="block text-xs text-slate-500">{option.description}</span>}
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
  options: SelectOption[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal">
            <span className="min-w-0 truncate">{values.length ? `Выбрано: ${values.length}` : placeholder}</span>
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
                onClick={() => onChange(values.includes(option.value) ? values.filter((value) => value !== option.value) : [...values, option.value])}
              >
                <Check className={cn('size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                <span className="font-medium text-slate-900">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
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
  options: SelectOption[];
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

function BooleanFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
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
