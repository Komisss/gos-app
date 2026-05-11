import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getReportsLinkValidation } from '@/entities/analytics/api/dashboard';
import type {
  DashboardPeriodType,
  LinkValidationGroupBy,
  LinkValidationReportStatus,
  ReportsLinkValidationPayload,
  ReportsLinkValidationResponse,
  SortDirection,
} from '@/entities/analytics/model/types';
import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { ReportTaskScope, ReportTaskType } from '@/entities/report/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getTasks } from '@/entities/task/api/tasks';
import { getUsers } from '@/entities/user/api/users';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

type SelectOption = { value: string; label: string; description?: string };

const periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }> = [
  { value: 'assignment_created', label: 'Создание назначения' },
  { value: 'deadline', label: 'Дедлайн' },
  { value: 'report_submitted', label: 'Отправка отчета' },
  { value: 'moderation_action', label: 'Действие модерации' },
];

const roleOptions = [
  { value: '1', label: 'Региональный' },
  { value: '2', label: 'Федеральный' },
];

const taskTypeOptions: Array<{ value: ReportTaskType; label: string }> = [
  { value: 'online_action', label: 'Онлайн-акция' },
  { value: 'street_action', label: 'Уличная акция' },
];

const taskScopeOptions: Array<{ value: ReportTaskScope; label: string }> = [
  { value: 'federal', label: 'Федеральный' },
  { value: 'regional', label: 'Региональный' },
];

const reportStatusOptions: Array<{ value: LinkValidationReportStatus; label: string }> = [
  { value: 'under_review', label: 'На проверке' },
  { value: 'accepted', label: 'Принято' },
  { value: 'revision_requested', label: 'Запрошена редакция' },
  { value: 'not_completed', label: 'Не выполнено' },
];

const groupByOptions: Array<{ value: LinkValidationGroupBy; label: string }> = [
  { value: 'region', label: 'Регион' },
  { value: 'task', label: 'Задача' },
  { value: 'org_unit', label: 'Оргструктура' },
  { value: 'user', label: 'Пользователь' },
  { value: 'domain', label: 'Домен' },
  { value: 'status', label: 'Статус' },
  { value: 'day', label: 'День' },
  { value: 'month', label: 'Месяц' },
];

const labelByKey: Record<string, string> = {
  org_unit_id: 'ID оргструктуры',
  org_unit_name: 'Оргструктура',
  org_unit_path: 'Путь',
  org_unit_status: 'Статус оргструктуры',
  region_id: 'ID региона',
  region_name: 'Регион',
  task_id: 'ID задачи',
  task_title: 'Задача',
  user_id: 'ID пользователя',
  user_display_name: 'Пользователь',
  domain: 'Домен',
  validation_status: 'Статус проверки',
  group_key: 'Ключ группы',
  group_name: 'Группа',
  link_reports: 'Ссылочные отчеты',
  checked_reports: 'Проверено',
  not_checked_reports: 'Не проверено',
  success_count: 'Успешно',
  unreachable_count: 'Недоступно',
  domain_not_allowed_count: 'Домен запрещен',
  http_error_count: 'HTTP ошибки',
  technical_error_count: 'Технические ошибки',
  problem_count: 'Проблемы',
  success_rate: 'Успешность',
  problem_rate: 'Проблемы',
  not_checked_rate: 'Не проверено',
  total_assignments: 'Назначения',
  assignments_with_reports: 'С отчетами',
  assignments_without_reports: 'Без отчетов',
  accepted_assignments: 'Принято назначений',
  not_completed_assignments: 'Не выполнено',
  deactivated_not_completed_assignments: 'Не выполнено деактив.',
  overdue_assignments: 'Просрочено',
  total_reports: 'Отчеты',
  accepted_reports: 'Принято отчетов',
  under_review_reports: 'На проверке',
  revision_requested_reports: 'На доработке',
  revision_requests: 'Запросы правок',
  avg_revision_used: 'Среднее правок',
  completion_rate: 'Выполнение',
  report_submission_rate: 'Отправка отчетов',
  not_completed_rate: 'Не выполнено',
  overdue_rate: 'Просрочки',
  revision_rate: 'Доработки',
  problem_level: 'Уровень проблемы',
};

export function ReportsLinkValidationStatistics() {
  const [filters, setFilters] = useState<ReportsLinkValidationPayload>(() => createInitialFilters());

  const regionsQuery = useQuery({ queryKey: ['regions'], queryFn: getRegions });
  const orgUnitsQuery = useQuery({ queryKey: ['org-units-tree'], queryFn: getOrgUnitsTree });
  const usersQuery = useQuery({ queryKey: ['users', 'reports-link-validation-filter'], queryFn: () => getUsers() });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'reports-link-validation-filter'], queryFn: () => getTasks() });
  const reportsMutation = useMutation({ mutationFn: getReportsLinkValidation });
  const result = reportsMutation.data;

  function updateFilters(patch: Partial<ReportsLinkValidationPayload>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(nextFilters = filters) {
    reportsMutation.mutate(nextFilters);
  }

  function goToPage(page: number) {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    handleSubmit(nextFilters);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DateFilter label="Дата с" value={filters.date_from} onChange={(date_from) => updateFilters({ date_from })} />
          <DateFilter label="Дата по" value={filters.date_to} onChange={(date_to) => updateFilters({ date_to })} />
          <FilterSelect label="Тип периода" value={filters.period_type} options={periodTypeOptions} onChange={(period_type) => updateFilters({ period_type: period_type as DashboardPeriodType })} />
          <FilterSelect label="Группировка" value={filters.group_by} options={groupByOptions} onChange={(group_by) => updateFilters({ group_by: group_by as LinkValidationGroupBy, page: 1 })} />
          <MultiSearchSelect label="Регионы" values={filters.region_ids.map(String)} placeholder="Все регионы" searchPlaceholder="Поиск региона" options={(regionsQuery.data ?? []).map((region) => ({ value: String(region.id), label: region.name, description: region.code }))} onChange={(region_ids) => updateFilters({ region_ids: toNumbers(region_ids), page: 1 })} />
          <MultiSearchSelect label="Оргструктуры" values={filters.org_unit_ids.map(String)} placeholder="Все оргструктуры" searchPlaceholder="Поиск оргструктуры" options={(orgUnitsQuery.data ?? []).map((orgUnit) => ({ value: String(orgUnit.id), label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}` }))} onChange={(org_unit_ids) => updateFilters({ org_unit_ids: toNumbers(org_unit_ids), page: 1 })} />
          <MultiSearchSelect label="Пользователи" values={filters.user_ids.map(String)} placeholder="Все пользователи" searchPlaceholder="Поиск пользователя" options={(usersQuery.data ?? []).map((user) => ({ value: String(user.id), label: user.fullName, description: `@${user.username}` }))} onChange={(user_ids) => updateFilters({ user_ids: toNumbers(user_ids), page: 1 })} />
          <MultiSelect label="Роли" values={filters.role_ids.map(String)} placeholder="Все роли" options={roleOptions} onChange={(role_ids) => updateFilters({ role_ids: toNumbers(role_ids), page: 1 })} />
          <MultiSearchSelect label="Задачи" values={filters.task_ids.map(String)} placeholder="Все задачи" searchPlaceholder="Поиск по id или названию" options={(tasksQuery.data ?? []).map((task) => ({ value: String(task.id), label: `#${task.id} ${task.title}`, description: task.statusLabel }))} onChange={(task_ids) => updateFilters({ task_ids: toNumbers(task_ids), page: 1 })} />
          <MultiSelect label="Тип задачи" values={filters.task_types} placeholder="Все типы" options={taskTypeOptions} onChange={(task_types) => updateFilters({ task_types: task_types as ReportTaskType[], page: 1 })} />
          <MultiSelect label="Масштаб задачи" values={filters.task_scope} placeholder="Любой масштаб" options={taskScopeOptions} onChange={(task_scope) => updateFilters({ task_scope: task_scope as ReportTaskScope[], page: 1 })} />
          <MultiSelect label="Статус отчета" values={filters.report_statuses} placeholder="Все статусы" options={reportStatusOptions} onChange={(report_statuses) => updateFilters({ report_statuses: report_statuses as LinkValidationReportStatus[], page: 1 })} />
          <TextListFilter label="Статусы валидации" values={filters.validation_statuses} placeholder="Например: ok, domain_not_allowed" onChange={(validation_statuses) => updateFilters({ validation_statuses, page: 1 })} />
          <TextListFilter label="Домены" values={filters.domains} placeholder="Например: vk.com, x.com" onChange={(domains) => updateFilters({ domains, page: 1 })} />
          <FilterSelect label="Сортировка" value={filters.sort_by} options={[{ value: 'problem_count', label: 'Количество проблем' }]} onChange={(sort_by) => updateFilters({ sort_by: sort_by as 'problem_count', page: 1 })} />
          <FilterSelect label="Направление" value={filters.sort_direction} options={[{ value: 'desc', label: 'По убыванию' }, { value: 'asc', label: 'По возрастанию' }]} onChange={(sort_direction) => updateFilters({ sort_direction: sort_direction as SortDirection, page: 1 })} />
          <NumberFilter label="Страница" value={filters.page} min={1} onChange={(page) => updateFilters({ page })} />
          <FilterSelect label="Размер страницы" value={String(filters.page_size)} options={[{ value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} onChange={(pageSize) => updateFilters({ page_size: Math.min(Number(pageSize), 100), page: 1 })} />
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
          <BooleanFilter label="Только текущая версия отчета" checked={filters.only_current_report_version} onChange={(only_current_report_version) => updateFilters({ only_current_report_version, page: 1 })} />
          <BooleanFilter label="Включать отчеты без валидации" checked={filters.include_reports_without_validation} onChange={(include_reports_without_validation) => updateFilters({ include_reports_without_validation, page: 1 })} />
          <BooleanFilter label="Включать неактивных пользователей" checked={filters.include_inactive_users} onChange={(include_inactive_users) => updateFilters({ include_inactive_users, page: 1 })} />
          <BooleanFilter label="Включать архивные задачи" checked={filters.include_archived_tasks} onChange={(include_archived_tasks) => updateFilters({ include_archived_tasks, page: 1 })} />
          <BooleanFilter label="Включать удаленные назначения" checked={filters.include_removed_assignments} onChange={(include_removed_assignments) => updateFilters({ include_removed_assignments, page: 1 })} />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={() => setFilters(createInitialFilters())}>Сбросить фильтры</Button>
          <Button type="button" className="bg-[#465cd3] text-white hover:bg-[#3c50bd]" disabled={reportsMutation.isPending} onClick={() => handleSubmit()}>
            {reportsMutation.isPending ? 'Загрузка...' : 'Получить статистику'}
          </Button>
        </div>
      </section>

      {reportsMutation.isError && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">Не удалось загрузить статистику по ссылочным отчетам.</div>}
      {result ? <ReportsLinkValidationResult result={result} onPageChange={goToPage} /> : <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Настройте фильтры и нажмите «Получить статистику».</div>}
    </div>
  );
}

function ReportsLinkValidationResult({ result, onPageChange }: { result: ReportsLinkValidationResponse; onPageChange: (page: number) => void }) {
  const rows = result.items as unknown as Array<Record<string, unknown>>;
  const columns = useMemo(() => getColumns(rows), [rows]);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <InfoPanel title="Период" items={[{ label: 'Дата с', value: formatDateTime(result.period.date_from) }, { label: 'Дата по', value: formatDateTime(result.period.date_to) }]} />
        <InfoPanel title="Примененные фильтры" items={formatAppliedFilters(result.filters_applied)} />
      </div>
      <TotalsGrid totals={result.totals as unknown as Record<string, unknown>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Найдено: {result.total}, страница {result.page}</p>
        <p className="text-sm text-slate-500">Обновлено: {formatDateTime(result.updated_at)}</p>
      </div>
      <TableScrollArea headerHeight="3rem" height="58vh">
        <Table className="min-w-[1100px] whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column) => <TableHead key={column}>{formatColumnLabel(column)}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={Math.max(columns.length, 1)} className="py-10 text-center text-sm text-slate-500">Нет данных.</TableCell></TableRow>
            ) : rows.map((item, index) => (
              <TableRow key={index} className={`align-top border-b-slate-200 hover:bg-slate-50/60 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`}>
                {columns.map((column) => <TableCell key={column} className="max-w-[260px] truncate">{formatMetricValue(item[column])}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <Button type="button" variant="outline" disabled={result.page <= 1} onClick={() => onPageChange(result.page - 1)}>Назад</Button>
        <span className="text-sm text-slate-500">Страница {result.page}, размер {result.page_size}</span>
        <Button type="button" variant="outline" disabled={!result.has_more} onClick={() => onPageChange(result.page + 1)}>Вперед</Button>
      </div>
    </section>
  );
}

function createInitialFilters(): ReportsLinkValidationPayload {
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
    user_ids: [],
    role_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    report_statuses: [],
    validation_statuses: [],
    domains: [],
    only_current_report_version: true,
    include_reports_without_validation: false,
    group_by: 'domain',
    include_inactive_users: false,
    include_archived_tasks: false,
    include_removed_assignments: false,
    sort_by: 'problem_count',
    sort_direction: 'desc',
    page: 1,
    page_size: 50,
  };
}

function MultiSearchSelect({ label, values, placeholder, searchPlaceholder, options, onChange }: { label: string; values: string[]; placeholder: string; searchPlaceholder: string; options: SelectOption[]; onChange: (values: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery ? options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery)) : options;
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
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(options.map((option) => option.value))}>Выбрать все</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>Очистить</Button>
          </div>
          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
            <div className="p-1">
              {filteredOptions.map((option) => (
                <button key={option.value} type="button" className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => toggleValue(option.value)}>
                  <Check className={cn('mt-0.5 size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900">{option.label}</span>
                    {option.description && <span className="block text-xs text-slate-500">{option.description}</span>}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MultiSelect({ label, values, placeholder, options, onChange }: { label: string; values: string[]; placeholder: string; options: Array<{ value: string; label: string }>; onChange: (values: string[]) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"><span className="min-w-0 truncate">{values.length ? `Выбрано: ${values.length}` : placeholder}</span><ChevronsUpDown className="size-4 opacity-50" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[min(360px,calc(100vw-3rem))] p-2"><div className="space-y-1">{options.map((option) => <button key={option.value} type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => onChange(values.includes(option.value) ? values.filter((value) => value !== option.value) : [...values, option.value])}><Check className={cn('size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} /><span className="font-medium text-slate-900">{option.label}</span></button>)}</div></PopoverContent></Popover></div>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" /></div>;
}

function TextListFilter({ label, values, placeholder, onChange }: { label: string; values: string[]; placeholder: string; onChange: (values: string[]) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Input className="h-9 border-slate-200 bg-white text-sm" value={values.join(', ')} placeholder={placeholder} onChange={(event) => onChange(toStringList(event.target.value))} /></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 w-full border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent align="start">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function NumberFilter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Input className="h-9 border-slate-200 bg-white text-sm" min={min} type="number" value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))} /></div>;
}

function BooleanFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />{label}</label>;
}

function TotalsGrid({ totals }: { totals: Record<string, unknown> }) {
  const items = Object.entries(totals);
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{items.map(([key, value]) => <div key={key} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="text-xs font-medium text-slate-500">{formatColumnLabel(key)}</div><div className="mt-1 text-xl font-semibold text-slate-900">{formatMetricValue(value)}</div></div>)}</div>;
}

function InfoPanel({ title, items }: { title: string; items: Array<{ label: string; value: React.ReactNode }> }) {
  return <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map((item) => <div key={item.label} className="rounded-md bg-slate-50 px-3 py-2"><div className="text-xs text-slate-500">{item.label}</div><div className="mt-1 break-words text-sm font-medium text-slate-900">{item.value}</div></div>)}</div></div>;
}

function formatAppliedFilters(filters: ReportsLinkValidationResponse['filters_applied']) {
  return [
    { label: 'Дата с', value: formatDateTime(filters.date_from) },
    { label: 'Дата по', value: formatDateTime(filters.date_to) },
    { label: 'Тип периода', value: getOptionLabel(periodTypeOptions, filters.period_type) },
    { label: 'Группировка', value: getOptionLabel(groupByOptions, filters.group_by) },
    { label: 'Регионы', value: formatArray(filters.region_ids) },
    { label: 'Оргструктуры', value: formatArray(filters.org_unit_ids) },
    { label: 'Пользователи', value: formatArray(filters.user_ids) },
    { label: 'Роли', value: formatOptions(roleOptions, (filters.role_ids ?? []).map(String)) },
    { label: 'Задачи', value: formatArray(filters.task_ids) },
    { label: 'Типы задач', value: formatOptions(taskTypeOptions, filters.task_types) },
    { label: 'Масштаб', value: formatOptions(taskScopeOptions, filters.task_scope) },
    { label: 'Статусы отчетов', value: formatOptions(reportStatusOptions, filters.report_statuses) },
    { label: 'Статусы валидации', value: formatArray(filters.validation_statuses) },
    { label: 'Домены', value: formatArray(filters.domains) },
    { label: 'Отчеты без валидации', value: filters.include_reports_without_validation ? 'Да' : 'Нет' },
    { label: 'Неактивные пользователи', value: filters.include_inactive_users === true ? 'Да' : 'Нет' },
    { label: 'Архивные задачи', value: filters.include_archived_tasks === true ? 'Да' : 'Нет' },
    { label: 'Удаленные назначения', value: filters.include_removed_assignments === true ? 'Да' : 'Нет' },
    { label: 'Только текущая версия', value: filters.only_current_report_version ? 'Да' : 'Нет' },
    { label: 'Сортировка', value: filters.sort_by },
    { label: 'Направление', value: filters.sort_direction },
  ];
}

function getColumns(rows: Array<Record<string, unknown>>) {
  const keys = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  return Array.from(keys);
}

function formatMetricValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'n/a';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string' && isDateLike(value)) return formatDateTime(value);
  return String(value);
}

function formatColumnLabel(key: string) {
  return labelByKey[key] ?? key.replaceAll('_', ' ');
}

function formatArray(values: Array<string | number>) { return values.length ? values.join(', ') : 'Все'; }
function formatOptions(options: Array<{ value: string; label: string }>, values: string[]) { return values.length ? values.map((value) => getOptionLabel(options, value)).join(', ') : 'Все'; }
function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) { return options.find((option) => option.value === value)?.label ?? value; }
function formatNumber(value: number) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value); }
function toNumbers(values: string[]) { return values.map(Number).filter((value) => Number.isFinite(value)); }
function toStringList(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function isDateLike(value: string) { return /^\d{4}-\d{2}-\d{2}T/.test(value); }
function formatDateTime(value?: string | null) {
  if (!value) return 'Не указано';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
