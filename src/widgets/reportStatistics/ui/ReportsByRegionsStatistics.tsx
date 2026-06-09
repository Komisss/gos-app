import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, ListFilter, Search } from 'lucide-react';

import { getReportsByRegions } from '@/entities/analytics/api/dashboard';
import type {
  DashboardPeriodType,
  ReportAnalyticsAssignmentStatus,
  ReportsByRegionsItem,
  ReportsByRegionsPayload,
  ReportsByRegionsResponse,
  SortDirection,
} from '@/entities/analytics/model/types';
import type { ExportCreateResponse } from '@/entities/export/model/types';
import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getTasks } from '@/entities/task/api/tasks';
import { cn } from '@/shared/lib/utils';
import { useRetainedValue } from '@/shared/lib/useRetainedValue';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';
import { AnalyticsExportStatusToast } from '@/widgets/reports/ui/AnalyticsExportStatusToast';
import { ReportsByRegionsExportPopover } from '@/widgets/reportStatistics/ui/ReportsByRegionsExportPopover';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

const periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }> = [
  { value: 'assignment_created', label: 'Создание назначения' },
  { value: 'deadline', label: 'Дедлайн' },
  { value: 'report_submitted', label: 'Отправка отчета' },
  { value: 'moderation_action', label: 'Действие модерации' },
];

const taskTypeOptions: Array<{ value: ReportTaskType; label: string }> = [
  { value: 'online_action', label: 'Онлайн-акция' },
  { value: 'street_action', label: 'Уличная акция' },
];

const taskScopeOptions: Array<{ value: ReportTaskScope; label: string }> = [
  { value: 'federal', label: 'Федеральный' },
  { value: 'regional', label: 'Региональный' },
];

const reportTypeOptions: Array<{ value: ReportType; label: string }> = [
  { value: 'link', label: 'Ссылка' },
  { value: 'image', label: 'Изображение' },
];

const assignmentStatusOptions: Array<{ value: ReportAnalyticsAssignmentStatus; label: string }> = [
  { value: 'assigned', label: 'Назначено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'under_review', label: 'На проверке' },
  { value: 'revision_requested', label: 'Запрошена редакция' },
  { value: 'accepted', label: 'Принято' },
  { value: 'not_completed', label: 'Не выполнено' },
];

const tableColumns: Array<{
  key: keyof ReportsByRegionsItem;
  label: string;
  kind?: 'percent' | 'number';
}> = [
  { key: 'region_name', label: 'Регион' },
  { key: 'rank', label: 'Место', kind: 'number' },
  { key: 'kpe', label: 'КПЭ региона', kind: 'number' },
  { key: 'done', label: 'Выполнено', kind: 'number' },
  { key: 'done_kpe_percent', label: 'Выполнение КПЭ', kind: 'percent' },
  { key: 'total_assignments', label: 'Назначения', kind: 'number' },
  { key: 'assignments_with_reports', label: 'С отчетами', kind: 'number' },
  { key: 'assignments_without_reports', label: 'Без отчетов', kind: 'number' },
  { key: 'not_completed_assignments', label: 'Не выполнено', kind: 'number' },
  { key: 'overdue_assignments', label: 'Просрочено', kind: 'number' },
  { key: 'total_reports', label: 'Отчеты', kind: 'number' },
  { key: 'under_review_reports', label: 'На проверке', kind: 'number' },
  { key: 'completion_rate', label: 'Выполнение', kind: 'percent' },
  { key: 'report_submission_rate', label: 'Отправка отчетов', kind: 'percent' },
  { key: 'not_completed_rate', label: 'Не выполнено', kind: 'percent' },
  { key: 'overdue_rate', label: 'Просрочки', kind: 'percent' },
  { key: 'moderation_acceptance_rate', label: 'Принятие модерацией', kind: 'percent' },
];

export function ReportsByRegionsStatistics() {
  const [filters, setFilters] = useState<ReportsByRegionsPayload>(() => createInitialFilters());
  const [exportJob, setExportJob] = useState<ExportCreateResponse | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'reports-by-regions-filter'],
    queryFn: () => getTasks(),
  });

  const reportsMutation = useMutation({
    mutationFn: getReportsByRegions,
  });

  const result = useRetainedValue(reportsMutation.data);
  const regionOptions = (regionsQuery.data ?? []).map((region) => ({
    value: String(region.id),
    label: region.name,
    description: region.code,
  }));
  const orgUnitOptions = (orgUnitsQuery.data ?? []).map((orgUnit) => ({
    value: String(orgUnit.id),
    label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
  }));
  const taskOptions = (tasksQuery.data ?? []).map((task) => ({
    value: String(task.id),
    label: `#${task.id} ${task.title}`,
    description: task.statusLabel,
  }));

  function handleSubmit(nextFilters = filters) {
    reportsMutation.mutate(nextFilters);
  }

  useEffect(() => {
    handleSubmit();
  }, []);

  function updateFilters(patch: Partial<ReportsByRegionsPayload>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function goToPage(page: number) {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    handleSubmit(nextFilters);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <ReportsByRegionsExportPopover
          tableFilters={filters}
          regionOptions={regionOptions}
          orgUnitOptions={orgUnitOptions}
          taskOptions={taskOptions}
          periodTypeOptions={periodTypeOptions}
          taskTypeOptions={taskTypeOptions}
          taskScopeOptions={taskScopeOptions}
          reportTypeOptions={reportTypeOptions}
          onExportStarted={setExportJob}
        />
        <Button
          type="button"
          variant="outline"
          className="w-fit border-slate-200 bg-white"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <ListFilter />
          Фильтры
        </Button>
      </div>
      {filtersOpen && (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            onChange={(region_ids) => updateFilters({ region_ids: toNumbers(region_ids), page: 1 })}
          />
          <MultiSearchSelect
            label="Структуры подчинения"
            values={filters.org_unit_ids.map(String)}
            placeholder="Все структуры подчинения"
            searchPlaceholder="Поиск структуры подчинения"
            options={orgUnitOptions}
            onChange={(org_unit_ids) =>
              updateFilters({ org_unit_ids: toNumbers(org_unit_ids), page: 1 })
            }
          />
          <MultiSearchSelect
            label="Задачи"
            values={filters.task_ids.map(String)}
            placeholder="Все задачи"
            searchPlaceholder="Поиск по id или названию"
            options={taskOptions}
            onChange={(task_ids) => updateFilters({ task_ids: toNumbers(task_ids), page: 1 })}
          />
          <MultiSelect
            label="Тип задачи"
            values={filters.task_types}
            placeholder="Все типы"
            options={taskTypeOptions}
            onChange={(task_types) =>
              updateFilters({ task_types: task_types as ReportTaskType[], page: 1 })
            }
          />
          <MultiSelect
            label="Масштаб задачи"
            values={filters.task_scope}
            placeholder="Любой масштаб"
            options={taskScopeOptions}
            onChange={(task_scope) =>
              updateFilters({ task_scope: task_scope as ReportTaskScope[], page: 1 })
            }
          />
          <MultiSelect
            label="Тип отчета"
            values={filters.report_types}
            placeholder="Все типы отчетов"
            options={reportTypeOptions}
            onChange={(report_types) =>
              updateFilters({ report_types: report_types as ReportType[], page: 1 })
            }
          />
          <MultiSelect
            label="Статус назначения"
            values={filters.assignment_statuses}
            placeholder="Все статусы"
            options={assignmentStatusOptions}
            onChange={(assignment_statuses) =>
              updateFilters({
                assignment_statuses: assignment_statuses as ReportAnalyticsAssignmentStatus[],
                page: 1,
              })
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
              updateFilters({ sort_by: sort_by as ReportsByRegionsPayload['sort_by'], page: 1 })
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
              updateFilters({ sort_direction: sort_direction as SortDirection })
            }
          />
          <NumberFilter
            label="Страница"
            value={filters.page}
            min={1}
            onChange={(page) => updateFilters({ page })}
          />
          <FilterSelect
            label="Размер страницы"
            value={String(filters.page_size)}
            options={[
              { value: '25', label: '25' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
            onChange={(pageSize) =>
              updateFilters({ page_size: Math.min(Number(pageSize), 100), page: 1 })
            }
          />
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
          <BooleanFilter
            label="Включать архивные задачи"
            checked={filters.include_archived_tasks}
            onChange={(include_archived_tasks) =>
              updateFilters({ include_archived_tasks, page: 1 })
            }
          />
          <BooleanFilter
            label="Включать удаленные назначения"
            checked={filters.include_removed_assignments}
            onChange={(include_removed_assignments) =>
              updateFilters({ include_removed_assignments, page: 1 })
            }
          />
          <BooleanFilter
            label="Только текущая версия отчета"
            checked={filters.only_current_report_version}
            onChange={(only_current_report_version) =>
              updateFilters({ only_current_report_version, page: 1 })
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFilters(createInitialFilters())}
          >
            Сбросить фильтры
          </Button>
          <Button
            type="button"
            className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
            disabled={reportsMutation.isPending}
            onClick={() => handleSubmit()}
          >
            {reportsMutation.isPending ? 'Загрузка...' : 'Получить статистику'}
          </Button>
        </div>
      </section>
      )}

      {reportsMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Не удалось загрузить статистику по регионам.
        </div>
      )}

      {result ? (
        <ReportsByRegionsResult result={result} onPageChange={goToPage} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Настройте фильтры и нажмите «Получить статистику».
        </div>
      )}
      <AnalyticsExportStatusToast
        exportJob={exportJob}
        title="Экспорт статистики по регионам"
        defaultFileName="analytics-by-regions.xlsx"
        onClose={() => setExportJob(null)}
      />
    </div>
  );
}

function ReportsByRegionsResult({
  result,
  onPageChange,
}: {
  result: ReportsByRegionsResponse;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <InfoPanel
          title="Период"
          items={[
            { label: 'Дата с', value: formatDateTime(result.period.date_from) },
            { label: 'Дата по', value: formatDateTime(result.period.date_to) },
          ]}
        />
        <InfoPanel
          title="Примененные фильтры"
          items={formatAppliedFilters(result.filters_applied)}
        />
      </div>

      <TotalsGrid totals={result.totals} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Найдено: {result.total}, страница {result.page}
        </p>
        <p className="text-sm text-slate-500">Обновлено: {formatDateTime(result.updated_at)}</p>
      </div>

      <TableScrollArea headerHeight="3rem" height="58vh">
        <Table className="min-w-[1100px] whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
              {tableColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="py-10 text-center text-sm text-slate-500"
                >
                  Нет данных.
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((item, index) => (
                <TableRow
                  key={index}
                  className={`align-top border-b-slate-200 hover:bg-slate-50/60 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`}
                >
                  {tableColumns.map((column) => (
                    <TableCell key={column.key} className="max-w-[260px] truncate">
                      {formatMetricValue(item[column.key], column.kind)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableScrollArea>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <Button
          type="button"
          variant="outline"
          disabled={result.page <= 1}
          onClick={() => onPageChange(result.page - 1)}
        >
          Назад
        </Button>
        <span className="text-sm text-slate-500">
          Страница {result.page}, размер {result.page_size}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={!result.has_more}
          onClick={() => onPageChange(result.page + 1)}
        >
          Вперед
        </Button>
      </div>
    </section>
  );
}

function createInitialFilters(): ReportsByRegionsPayload {
  const now = new Date();
  const dateFrom = new Date(now);
  const dateTo = new Date(now);
  dateFrom.setMonth(dateFrom.getMonth() - 6);
  dateTo.setMonth(dateTo.getMonth() + 5);

  return {
    date_from: dateFrom.toISOString(),
    date_to: dateTo.toISOString(),
    period_type: 'assignment_created',
    region_ids: [],
    org_unit_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    assignment_statuses: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
    sort_by: 'not_completed_rate',
    sort_direction: 'desc',
    page: 1,
    page_size: 50,
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

function NumberFilter({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Input
        className="h-9 border-slate-200 bg-white text-sm"
        min={min}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
      />
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

function TotalsGrid({ totals }: { totals: ReportsByRegionsResponse['totals'] }) {
  const items = [
    { label: 'КПЭ регионов', value: formatNumber(totals.kpe) },
    { label: 'Выполнено по КПЭ', value: formatNumber(totals.done) },
    { label: 'Выполнение КПЭ', value: formatPercent(totals.done_kpe_percent) },
    { label: 'Назначений', value: totals.total_assignments },
    { label: 'С отчетами', value: totals.assignments_with_reports },
    { label: 'Без отчетов', value: totals.assignments_without_reports },
    { label: 'Принято назначений', value: totals.accepted_assignments },
    { label: 'Не выполнено', value: totals.not_completed_assignments },
    { label: 'Просрочено', value: totals.overdue_assignments },
    { label: 'Отчетов', value: totals.total_reports },
    { label: 'Принято отчетов', value: totals.accepted_reports },
    { label: 'На проверке', value: totals.under_review_reports },
    { label: 'На доработке', value: totals.revision_requested_reports },
    { label: 'Запросов правок', value: totals.revision_requests },
    { label: 'Выполнение', value: formatPercent(totals.completion_rate) },
    { label: 'Отправка отчетов', value: formatPercent(totals.report_submission_rate) },
    { label: 'Не выполнено', value: formatPercent(totals.not_completed_rate) },
    { label: 'Просрочки', value: formatPercent(totals.overdue_rate) },
    { label: 'Принятие модерацией', value: formatPercent(totals.moderation_acceptance_rate) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="text-xs font-medium text-slate-500">{item.label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function InfoPanel({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 break-words text-sm font-medium text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMetricValue(value: unknown, kind?: 'percent' | 'number') {
  if (value === null || value === undefined || value === '') {
    return 'n/a';
  }

  if (kind === 'percent' && typeof value === 'number') {
    return formatPercent(value);
  }

  if (kind === 'number' && typeof value === 'number') {
    return formatNumber(value);
  }

  return String(value);
}

function formatAppliedFilters(filters: ReportsByRegionsResponse['filters_applied']) {
  return [
    { label: 'Дата с', value: formatDateTime(filters.date_from) },
    { label: 'Дата по', value: formatDateTime(filters.date_to) },
    { label: 'Тип периода', value: getOptionLabel(periodTypeOptions, filters.period_type) },
    { label: 'Регионы', value: formatArray(filters.region_ids) },
    { label: 'Структуры подчинения', value: formatArray(filters.org_unit_ids) },
    { label: 'Задачи', value: formatArray(filters.task_ids) },
    { label: 'Типы задач', value: formatOptions(taskTypeOptions, filters.task_types) },
    { label: 'Масштаб', value: formatOptions(taskScopeOptions, filters.task_scope) },
    { label: 'Типы отчетов', value: formatOptions(reportTypeOptions, filters.report_types) },
    {
      label: 'Статусы назначений',
      value: formatOptions(assignmentStatusOptions, filters.assignment_statuses ?? []),
    },
    { label: 'Архивные задачи', value: filters.include_archived_tasks ? 'Да' : 'Нет' },
    { label: 'Удаленные назначения', value: filters.include_removed_assignments ? 'Да' : 'Нет' },
    { label: 'Только текущая версия', value: filters.only_current_report_version ? 'Да' : 'Нет' },
    { label: 'Сортировка', value: filters.sort_by },
    { label: 'Направление', value: filters.sort_direction },
    { label: 'Источник', value: filters.source ?? 'Не указан' },
  ];
}

function formatArray(values: Array<string | number>) {
  return values.length ? values.join(', ') : 'Все';
}

function formatOptions(options: Array<{ value: string; label: string }>, values: string[]) {
  if (values.length === 0) {
    return 'Все';
  }

  return values.map((value) => getOptionLabel(options, value)).join(', ');
}

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}

function toNumbers(values: string[]) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Не указано';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
