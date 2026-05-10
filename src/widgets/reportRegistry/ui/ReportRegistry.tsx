import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, ListFilter, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { searchReports } from '@/entities/report/api/reports';
import type {
  AssignmentStatus,
  ReportSearchPayload,
  ReportStatus,
  ReportTaskScope,
  ReportTaskType,
  ReportType,
} from '@/entities/report/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getReportFormatLabel, getTaskTypeLabel, getTasks } from '@/entities/task/api/tasks';
import { getUsers } from '@/entities/user/api/users';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

type ReportFilters = {
  search: string;
  region_ids: number[];
  task_ids: number[];
  user_ids: number[];
  org_unit_ids: number[];
  role_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  report_statuses: ReportStatus[];
  assignment_statuses: AssignmentStatus[];
  submitted_from: string;
  submitted_to: string;
  deadline_from: string;
  deadline_to: string;
  created_from: string;
  created_to: string;
  is_overdue: boolean;
  has_report: boolean;
  only_current_version: boolean;
  include_removed: boolean;
  page: number;
  page_size: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
};

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

const roleOptions = [
  { value: '1', label: 'Федеральный управляющий' },
  { value: '2', label: 'Региональный руководитель' },
  { value: '3', label: 'Исполнитель' },
  { value: '4', label: 'Главный менеджер' },
  { value: '5', label: 'Помощник главного менеджера' },
  { value: '6', label: 'Руководитель управления' },
  { value: '7', label: 'Руководитель отдела' },
  { value: '8', label: 'Сотрудник' },
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

const reportStatusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: 'under_review', label: 'На проверке' },
  { value: 'accepted', label: 'Принят' },
  { value: 'revision_requested', label: 'Нужна доработка' },
  { value: 'not_completed', label: 'Не выполнен' },
];

const assignmentStatusOptions: Array<{ value: AssignmentStatus; label: string }> = [
  { value: 'assigned', label: 'Назначено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'under_review', label: 'На проверке' },
  { value: 'revision_requested', label: 'Нужна доработка' },
  { value: 'accepted', label: 'Принято' },
  { value: 'not_completed', label: 'Не выполнено' },
];

const initialFilters: ReportFilters = {
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
  submitted_from: '',
  submitted_to: '',
  deadline_from: '',
  deadline_to: '',
  created_from: '',
  created_to: '',
  is_overdue: false,
  has_report: false,
  only_current_version: true,
  include_removed: false,
  page: 1,
  page_size: 50,
  sort_by: 'submitted_at',
  sort_direction: 'desc',
};

export function ReportRegistry() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'report-filter'],
    queryFn: () => getTasks(),
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'report-filter'],
    queryFn: () => getUsers(),
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const reportsQuery = useQuery({
    queryKey: ['crm-reports', appliedFilters],
    queryFn: () => searchReports(toReportPayload(appliedFilters ?? initialFilters)),
    enabled: appliedFilters !== null,
  });

  const reports = reportsQuery.data?.items ?? [];
  const summary = reportsQuery.data?.summary;
  const hasRequestedReports = appliedFilters !== null;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold !text-slate-900">Статистика</h1>
            <p className="text-sm text-slate-500">Реестр отчетов по задачам, пользователям, регионам и оргструктурам.</p>
          </div>

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
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterText
                label="Поиск"
                value={filters.search}
                placeholder="Поиск по отчетам"
                onChange={(search) => setFilters((current) => ({ ...current, search, page: 1 }))}
              />
              <MultiSearchSelect
                label="Регионы"
                values={filters.region_ids.map(String)}
                placeholder="Все регионы"
                searchPlaceholder="Поиск региона"
                options={(regionsQuery.data ?? []).map((region) => ({
                  value: String(region.id),
                  label: region.name,
                  description: region.code,
                }))}
                onChange={(region_ids) => setFilters((current) => ({ ...current, region_ids: toNumbers(region_ids), page: 1 }))}
              />
              <MultiSearchSelect
                label="Задачи"
                values={filters.task_ids.map(String)}
                placeholder="Все задачи"
                searchPlaceholder="Поиск по id или названию"
                options={(tasksQuery.data ?? []).map((task) => ({
                  value: String(task.id),
                  label: `#${task.id} ${task.title}`,
                  description: task.statusLabel,
                }))}
                onChange={(task_ids) => setFilters((current) => ({ ...current, task_ids: toNumbers(task_ids), page: 1 }))}
              />
              <MultiSearchSelect
                label="Пользователи"
                values={filters.user_ids.map(String)}
                placeholder="Все пользователи"
                searchPlaceholder="Поиск по ФИО или username"
                options={(usersQuery.data ?? []).map((user) => ({
                  value: String(user.id),
                  label: user.fullName,
                  description: `@${user.username}`,
                }))}
                onChange={(user_ids) => setFilters((current) => ({ ...current, user_ids: toNumbers(user_ids), page: 1 }))}
              />
              <MultiSearchSelect
                label="Оргструктуры"
                values={filters.org_unit_ids.map(String)}
                placeholder="Все оргструктуры"
                searchPlaceholder="Поиск оргструктуры"
                options={(orgUnitsQuery.data ?? []).map((orgUnit) => ({
                  value: String(orgUnit.id),
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                }))}
                onChange={(org_unit_ids) => setFilters((current) => ({ ...current, org_unit_ids: toNumbers(org_unit_ids), page: 1 }))}
              />
              <MultiSelect
                label="Роли"
                values={filters.role_ids.map(String)}
                placeholder="Все роли"
                options={roleOptions}
                onChange={(role_ids) => setFilters((current) => ({ ...current, role_ids: toNumbers(role_ids), page: 1 }))}
              />
              <MultiSelect
                label="Тип задачи"
                values={filters.task_types}
                placeholder="Все типы"
                options={taskTypeOptions}
                onChange={(task_types) => setFilters((current) => ({ ...current, task_types: task_types as ReportTaskType[], page: 1 }))}
              />
              <MultiSelect
                label="Масштаб задачи"
                values={filters.task_scope}
                placeholder="Любой масштаб"
                options={taskScopeOptions}
                onChange={(task_scope) => setFilters((current) => ({ ...current, task_scope: task_scope as ReportTaskScope[], page: 1 }))}
              />
              <MultiSelect
                label="Тип отчета"
                values={filters.report_types}
                placeholder="Все типы отчетов"
                options={reportTypeOptions}
                onChange={(report_types) => setFilters((current) => ({ ...current, report_types: report_types as ReportType[], page: 1 }))}
              />
              <MultiSelect
                label="Статус отчета"
                values={filters.report_statuses}
                placeholder="Все статусы отчетов"
                options={reportStatusOptions}
                onChange={(report_statuses) => setFilters((current) => ({ ...current, report_statuses: report_statuses as ReportStatus[], page: 1 }))}
              />
              <MultiSelect
                label="Статус назначения"
                values={filters.assignment_statuses}
                placeholder="Все статусы назначений"
                options={assignmentStatusOptions}
                onChange={(assignment_statuses) =>
                  setFilters((current) => ({
                    ...current,
                    assignment_statuses: assignment_statuses as AssignmentStatus[],
                    page: 1,
                  }))
                }
              />
              <DateFilter label="Отправлен от" value={filters.submitted_from} onChange={(submitted_from) => setFilters((current) => ({ ...current, submitted_from, page: 1 }))} />
              <DateFilter label="Отправлен до" value={filters.submitted_to} onChange={(submitted_to) => setFilters((current) => ({ ...current, submitted_to, page: 1 }))} />
              <DateFilter label="Дедлайн от" value={filters.deadline_from} onChange={(deadline_from) => setFilters((current) => ({ ...current, deadline_from, page: 1 }))} />
              <DateFilter label="Дедлайн до" value={filters.deadline_to} onChange={(deadline_to) => setFilters((current) => ({ ...current, deadline_to, page: 1 }))} />
              <DateFilter label="Создан от" value={filters.created_from} onChange={(created_from) => setFilters((current) => ({ ...current, created_from, page: 1 }))} />
              <DateFilter label="Создан до" value={filters.created_to} onChange={(created_to) => setFilters((current) => ({ ...current, created_to, page: 1 }))} />
              <FilterSelect
                label="Сортировка"
                value={filters.sort_by}
                options={[
                  { value: 'submitted_at', label: 'Дата отправки' },
                  { value: 'deadline_at', label: 'Дедлайн' },
                  { value: 'created_at', label: 'Дата создания' },
                ]}
                onChange={(sort_by) => setFilters((current) => ({ ...current, sort_by }))}
              />
              <FilterSelect
                label="Направление"
                value={filters.sort_direction}
                options={[
                  { value: 'desc', label: 'По убыванию' },
                  { value: 'asc', label: 'По возрастанию' },
                ]}
                onChange={(sort_direction) =>
                  setFilters((current) => ({ ...current, sort_direction: sort_direction as 'asc' | 'desc' }))
                }
              />
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 xl:grid-cols-4">
              <BooleanFilter label="Просрочен" checked={filters.is_overdue} onChange={(is_overdue) => setFilters((current) => ({ ...current, is_overdue, page: 1 }))} />
              <BooleanFilter label="Есть отчет" checked={filters.has_report} onChange={(has_report) => setFilters((current) => ({ ...current, has_report, page: 1 }))} />
              <BooleanFilter label="Только текущая версия" checked={filters.only_current_version} onChange={(only_current_version) => setFilters((current) => ({ ...current, only_current_version, page: 1 }))} />
              <BooleanFilter label="Включая удаленные" checked={filters.include_removed} onChange={(include_removed) => setFilters((current) => ({ ...current, include_removed, page: 1 }))} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Размер страницы</span>
                <Select
                  value={String(filters.page_size)}
                  onValueChange={(page_size) => setFilters((current) => ({ ...current, page_size: Number(page_size), page: 1 }))}
                >
                  <SelectTrigger className="h-9 w-24 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setFilters(initialFilters)}>
                  Сбросить фильтры
                </Button>
                <Button
                  type="button"
                  className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
                  disabled={reportsQuery.isFetching}
                  onClick={() => setAppliedFilters(filters)}
                >
                  {reportsQuery.isFetching ? 'Загрузка...' : 'Получить отчеты'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {hasRequestedReports && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Найдено: {reportsQuery.data?.total ?? reports.length}
              {reportsQuery.data ? `, страница ${reportsQuery.data.page}` : ''}
            </p>
          </div>
        )}

        {summary && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryItem label="Всего отчетов" value={summary.total_reports} />
            <SummaryItem label="На проверке" value={summary.under_review_count} />
            <SummaryItem label="Принято" value={summary.accepted_count} />
            <SummaryItem label="На доработке" value={summary.revision_requested_count} />
            <SummaryItem label="Не выполнено" value={summary.not_completed_count} />
            <SummaryItem label="Просрочено" value={summary.overdue_count} tone="danger" />
          </div>
        )}

        {!hasRequestedReports ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Настройте фильтры и нажмите «Получить отчеты».
          </div>
        ) : reportsQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем отчеты...
          </div>
        ) : reportsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить отчеты.
          </div>
        ) : (
          <TableScrollArea headerHeight="3rem" height="70vh">
            <Table className="min-w-[1500px] whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-28">Назначение</TableHead>
                  <TableHead className="min-w-[300px]">Задача</TableHead>
                  <TableHead className="min-w-[240px]">Исполнитель</TableHead>
                  <TableHead className="min-w-[220px]">Регион</TableHead>
                  <TableHead className="min-w-[220px]">Оргструктура</TableHead>
                  <TableHead className="w-40">Тип задачи</TableHead>
                  <TableHead className="w-40">Формат отчета</TableHead>
                  <TableHead className="w-40">Отчет</TableHead>
                  <TableHead className="w-44">Статус назначения</TableHead>
                  <TableHead className="w-32">Правки</TableHead>
                  <TableHead className="w-44">Отправлен</TableHead>
                  <TableHead className="w-44">Дедлайн</TableHead>
                  <TableHead className="w-32">Просрочен</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-10 text-center text-sm text-slate-500">
                      Отчетов пока нет.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    <TableRow
                      key={`${report.id}-${index}`}
                      className={`align-top border-b-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`}
                    >
                      <TableCell className="font-medium text-slate-700">#{report.assignmentId}</TableCell>
                      <TableCell className="min-w-[300px]">
                        <div className="space-y-1 whitespace-normal">
                          <div className="font-medium text-slate-900">{report.taskTitle}</div>
                          <div className="text-xs text-slate-500">
                            ID задачи: {report.taskId} • {getTaskScopeLabel(report.taskScope)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">{report.executorName}</div>
                          <div className="text-xs text-slate-500">
                            ID: {report.executorId ?? 'n/a'} • {report.executorRole}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">{report.regionName}</TableCell>
                      <TableCell className="text-slate-700">{report.orgUnitName}</TableCell>
                      <TableCell>{getTaskTypeLabel(report.taskType)}</TableCell>
                      <TableCell>{getReportFormatLabel(report.requiredReportFormat)}</TableCell>
                      <TableCell>
                        {report.reportStatus ? (
                          <StatusBadge value={report.reportStatus} label={getReportStatusLabel(report.reportStatus)} />
                        ) : (
                          <span className="text-sm text-slate-500">Нет отчета</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={report.assignmentStatus} label={getAssignmentStatusLabel(report.assignmentStatus)} />
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {report.revisionUsed} / {report.revisionLimit}
                      </TableCell>
                      <TableCell className="text-slate-700">{formatDateTime(report.submittedAt)}</TableCell>
                      <TableCell className="text-slate-700">{formatDateTime(report.deadlineAt)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${
                            report.isOverdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {report.isOverdue ? 'Да' : 'Нет'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollArea>
        )}
      </div>
    </div>
  );
}

function toReportPayload(filters: ReportFilters): ReportSearchPayload {
  return {
    ...filters,
    submitted_from: filters.submitted_from || null,
    submitted_to: filters.submitted_to || null,
    deadline_from: filters.deadline_from || null,
    deadline_to: filters.deadline_to || null,
    created_from: filters.created_from || null,
    created_to: filters.created_to || null,
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
  options: Array<{ value: string; label: string }>;
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

function FilterText({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
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

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
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

function SummaryItem({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ value, label }: { value: string; label: string }) {
  const className =
    value === 'accepted'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'revision_requested' || value === 'not_completed'
        ? 'bg-red-100 text-red-700'
        : value === 'under_review'
          ? 'bg-sky-100 text-sky-700'
          : 'bg-slate-200 text-slate-700';

  return <Badge className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${className}`}>{label}</Badge>;
}

function toNumbers(values: string[]) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function getAssignmentStatusLabel(status: string) {
  return assignmentStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getReportStatusLabel(status: string) {
  return reportStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getTaskScopeLabel(scope: string) {
  return taskScopeOptions.find((option) => option.value === scope)?.label ?? scope;
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
