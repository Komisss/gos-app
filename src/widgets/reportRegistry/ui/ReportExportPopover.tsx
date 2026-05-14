import { useMemo, useState } from 'react';
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

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  reportFilters: ReportSearchPayload;
  regionOptions: SelectOption[];
  taskOptions: SelectOption[];
  userOptions: SelectOption[];
  orgUnitOptions: SelectOption[];
  roleOptions: SelectOption[];
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  reportStatusOptions: Array<{ value: ReportStatus; label: string }>;
  assignmentStatusOptions: Array<{ value: AssignmentStatus; label: string }>;
  onExportStarted: (job: ReportsExportResponse) => void;
};

const reportExportColumns = [
  'group_key',
  'group_name',
  'total_assignments',
  'overdue_assignments',
  'not_completed_assignments',
  'deactivated_not_completed_assignments',
  'not_completed_without_report',
  'not_completed_after_revision',
  'assignments_under_review_after_deadline',
  'overdue_rate',
  'not_completed_rate',
  'avg_days_overdue',
  'max_days_overdue',
];

export function ReportExportPopover({
  reportFilters,
  regionOptions,
  taskOptions,
  userOptions,
  orgUnitOptions,
  roleOptions,
  taskTypeOptions,
  taskScopeOptions,
  reportTypeOptions,
  reportStatusOptions,
  assignmentStatusOptions,
  onExportStarted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ReportSearchPayload>(() => createEmptyExportFilters());

  const exportMutation = useMutation({
    mutationFn: () =>
      exportReports({
        exportType: 'analytics_overdue_not_completed',
        format: 'xlsx',
        filters,
        columns: reportExportColumns,
        asyncMode: true,
      }),
    onSuccess: (job) => {
      onExportStarted(job);
      setOpen(false);
    },
  });

  function updateFilters(patch: Partial<ReportSearchPayload>) {
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
            <h3 className="text-sm font-semibold text-slate-900">Экспорт отчетов</h3>
            <p className="mt-1 text-xs text-slate-500">
              Фильтры экспорта открываются пустыми. Можно заполнить их вручную или перенести
              текущие фильтры таблицы.
            </p>
          </div>

          <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-4">
            <FilterText
              label="Поиск"
              value={filters.search}
              placeholder="Поиск по отчетам"
              onChange={(search) => updateFilters({ search })}
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
              label="Задачи"
              values={filters.task_ids.map(String)}
              placeholder="Все задачи"
              searchPlaceholder="Поиск по id или названию"
              options={taskOptions}
              onChange={(task_ids) => updateFilters({ task_ids: toNumbers(task_ids) })}
            />
            <MultiSearchSelect
              label="Пользователи"
              values={filters.user_ids.map(String)}
              placeholder="Все пользователи"
              searchPlaceholder="Поиск по ФИО или username"
              options={userOptions}
              onChange={(user_ids) => updateFilters({ user_ids: toNumbers(user_ids) })}
            />
            <MultiSearchSelect
              label="Оргструктуры"
              values={filters.org_unit_ids.map(String)}
              placeholder="Все оргструктуры"
              searchPlaceholder="Поиск оргструктуры"
              options={orgUnitOptions}
              onChange={(org_unit_ids) => updateFilters({ org_unit_ids: toNumbers(org_unit_ids) })}
            />
            <MultiSelect
              label="Роли"
              values={filters.role_ids.map(String)}
              placeholder="Все роли"
              options={roleOptions}
              onChange={(role_ids) => updateFilters({ role_ids: toNumbers(role_ids) })}
            />
            <MultiSelect
              label="Тип задачи"
              values={filters.task_types}
              placeholder="Все типы"
              options={taskTypeOptions}
              onChange={(task_types) => updateFilters({ task_types: task_types as ReportTaskType[] })}
            />
            <MultiSelect
              label="Масштаб задачи"
              values={filters.task_scope}
              placeholder="Любой масштаб"
              options={taskScopeOptions}
              onChange={(task_scope) => updateFilters({ task_scope: task_scope as ReportTaskScope[] })}
            />
            <MultiSelect
              label="Тип отчета"
              values={filters.report_types}
              placeholder="Все типы отчетов"
              options={reportTypeOptions}
              onChange={(report_types) => updateFilters({ report_types: report_types as ReportType[] })}
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
            <MultiSelect
              label="Статус назначения"
              values={filters.assignment_statuses}
              placeholder="Все статусы назначений"
              options={assignmentStatusOptions}
              onChange={(assignment_statuses) =>
                updateFilters({ assignment_statuses: assignment_statuses as AssignmentStatus[] })
              }
            />
            <DateFilter
              label="Отправлен от"
              value={filters.submitted_from ?? ''}
              onChange={(submitted_from) => updateFilters({ submitted_from: submitted_from || null })}
            />
            <DateFilter
              label="Отправлен до"
              value={filters.submitted_to ?? ''}
              onChange={(submitted_to) => updateFilters({ submitted_to: submitted_to || null })}
            />
            <DateFilter
              label="Дедлайн от"
              value={filters.deadline_from ?? ''}
              onChange={(deadline_from) => updateFilters({ deadline_from: deadline_from || null })}
            />
            <DateFilter
              label="Дедлайн до"
              value={filters.deadline_to ?? ''}
              onChange={(deadline_to) => updateFilters({ deadline_to: deadline_to || null })}
            />
            <DateFilter
              label="Создан от"
              value={filters.created_from ?? ''}
              onChange={(created_from) => updateFilters({ created_from: created_from || null })}
            />
            <DateFilter
              label="Создан до"
              value={filters.created_to ?? ''}
              onChange={(created_to) => updateFilters({ created_to: created_to || null })}
            />
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
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <NullableBooleanFilter
              label="Просрочен"
              checked={filters.is_overdue}
              onChange={(is_overdue) => updateFilters({ is_overdue })}
            />
            <NullableBooleanFilter
              label="Есть отчет"
              checked={filters.has_report}
              onChange={(has_report) => updateFilters({ has_report })}
            />
            <BooleanFilter
              label="Только текущая версия"
              checked={filters.only_current_version}
              onChange={(only_current_version) => updateFilters({ only_current_version })}
            />
            <BooleanFilter
              label="Включать удаленные"
              checked={filters.include_removed}
              onChange={(include_removed) => updateFilters({ include_removed })}
            />
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
              <Button type="button" variant="outline" onClick={() => setFilters(reportFilters)}>
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

function createEmptyExportFilters(): ReportSearchPayload {
  return {
    search: '',
    region_ids: [],
    task_ids: [],
    user_ids: [],
    org_unit_ids: [],
    role_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    report_statuses: [],
    assignment_statuses: [],
    submitted_from: null,
    submitted_to: null,
    deadline_from: null,
    deadline_to: null,
    created_from: null,
    created_to: null,
    is_overdue: null,
    has_report: null,
    only_current_version: true,
    include_removed: false,
    page: 1,
    page_size: 50,
    sort_by: 'submitted_at',
    sort_direction: 'desc',
  };
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
          <Button type="button" variant="outline" className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal">
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

function FilterText({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Input className="h-9 border-slate-200 text-sm" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату и время" />
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

function NullableBooleanFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean | null;
  onChange: (checked: boolean | null) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
      <Checkbox checked={checked === true} onCheckedChange={(value) => onChange(value === true ? true : null)} />
      {label}
    </div>
  );
}

function toNumbers(values: string[]) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}
