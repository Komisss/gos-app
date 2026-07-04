import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  Clock3,
  FileCheck2,
  Link2,
  ListChecks,
  Search,
} from 'lucide-react';

import { getAnalyticsDashboard } from '@/entities/analytics/api/dashboard';
import type {
  AnalyticsDashboardPayload,
  AnalyticsDashboardResponse,
  DashboardPeriodType,
} from '@/entities/analytics/model/types';
import type { ExportCreateResponse } from '@/entities/export/model/types';
import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';
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
import { AnalyticsDashboardExportPopover } from '@/widgets/reports/ui/AnalyticsDashboardExportPopover';
import { AnalyticsExportStatusToast } from '@/widgets/reports/ui/AnalyticsExportStatusToast';
import { RussiaRegionsMap } from '@/widgets/reports/ui/RussiaRegionsMap';

type DashboardFilters = AnalyticsDashboardPayload;

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

export function ReportsDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>(() => createInitialFilters());
  const [exportJob, setExportJob] = useState<ExportCreateResponse | null>(null);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'analytics-dashboard-filter'],
    queryFn: () => getTasks(),
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'analytics-dashboard-filter'],
    queryFn: () => getUsers(),
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const dashboardMutation = useMutation({
    mutationFn: getAnalyticsDashboard,
  });

  function handleSubmit() {
    dashboardMutation.mutate(filters);
  }

  const regionOptions = (regionsQuery.data ?? []).map((region) => ({
    value: String(region.id),
    label: region.name,
    description: region.code,
  }));
  const taskOptions = (tasksQuery.data ?? []).map((task) => ({
    value: String(task.id),
    label: `#${task.id} ${task.title}`,
    description: task.statusLabel,
  }));
  const orgUnitOptions = (orgUnitsQuery.data ?? []).map((orgUnit) => ({
    value: String(orgUnit.id),
    label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
  }));
  const userOptions = (usersQuery.data ?? []).map((user) => ({
    value: String(user.id),
    label: user.fullName,
    description: `@${user.username}`,
  }));

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold !text-slate-900">Дашборд</h1>
            <p className="text-sm text-slate-500">
              Сводная статистика по отчетам, назначениям, срокам и модерации.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnalyticsDashboardExportPopover
              dashboardFilters={filters}
              regionOptions={regionOptions}
              taskOptions={taskOptions}
              orgUnitOptions={orgUnitOptions}
              userOptions={userOptions}
              periodTypeOptions={periodTypeOptions}
              taskTypeOptions={taskTypeOptions}
              taskScopeOptions={taskScopeOptions}
              reportTypeOptions={reportTypeOptions}
              onExportStarted={setExportJob}
            />
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <DateFilter
              label="Дата с"
              value={filters.date_from}
              onChange={(date_from) => setFilters((current) => ({ ...current, date_from }))}
            />
            <DateFilter
              label="Дата по"
              value={filters.date_to}
              onChange={(date_to) => setFilters((current) => ({ ...current, date_to }))}
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
              disabled={dashboardMutation.isPending}
              onClick={handleSubmit}
            >
              {dashboardMutation.isPending ? 'Загрузка...' : 'Получить дашборд'}
            </Button>
          </div>
        </section>

        <RussiaRegionsMap
          regions={regionsQuery.data ?? []}
          onRegionClick={(region) => navigate(`/stats/dashboard/region/${region.id}`)}
        />

        {dashboardMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Не удалось загрузить данные дашборда.
          </div>
        )}

        {dashboardMutation.data ? (
          <DashboardResult data={dashboardMutation.data} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Настройте фильтры и нажмите «Получить дашборд».
          </div>
        )}
      </div>
      <AnalyticsExportStatusToast exportJob={exportJob} onClose={() => setExportJob(null)} />
    </div>
  );
}

function DashboardResult({ data }: { data: AnalyticsDashboardResponse }) {
  const items = [
    {
      label: 'KPI',
      icon: BarChart3,
      metrics: [
        { label: 'Всего назначений', value: data.kpi.total_assignments },
        { label: 'С отчетами', value: data.kpi.assignments_with_reports },
        { label: 'Без отчетов', value: data.kpi.assignments_without_reports },
        { label: 'Всего отчетов', value: data.kpi.total_reports },
        { label: 'Принято', value: data.kpi.accepted_reports },
        { label: 'На проверке', value: data.kpi.under_review_reports },
        { label: 'На доработке', value: data.kpi.revision_requested_reports },
        { label: 'Не выполнено', value: data.kpi.not_completed_assignments },
      ],
    },
    {
      label: 'Модерация',
      icon: FileCheck2,
      metrics: [
        { label: 'Проверено отчетов', value: data.moderation.moderated_reports },
        { label: 'Принято модерацией', value: data.moderation.accepted_by_moderation },
        { label: 'Возвращено', value: data.moderation.revision_requested_by_moderation },
        { label: 'Ожидает', value: data.moderation.pending_moderation },
        { label: 'Принятие', value: formatPercent(data.moderation.moderation_acceptance_rate) },
        { label: 'Доработки', value: formatPercent(data.moderation.moderation_revision_rate) },
      ],
    },
    {
      label: 'Выполнение',
      icon: ListChecks,
      metrics: [
        { label: 'Выполнение', value: formatPercent(data.completion.completion_rate) },
        { label: 'Отправка отчетов', value: formatPercent(data.completion.report_submission_rate) },
        { label: 'Не выполнено', value: formatPercent(data.completion.not_completed_rate) },
      ],
    },
    {
      label: 'Просрочки',
      icon: Clock3,
      metrics: [
        { label: 'Просрочено', value: data.overdue.overdue_assignments },
        { label: 'Без отчета', value: data.overdue.overdue_without_report },
        { label: 'С отчетом', value: data.overdue.overdue_with_report },
        { label: 'Доля просрочек', value: formatPercent(data.overdue.overdue_rate) },
      ],
    },
    {
      label: 'Доработки',
      icon: FileCheck2,
      metrics: [
        { label: 'Назначений с доработкой', value: data.revision.assignments_with_revision },
        { label: 'Всего запросов', value: data.revision.total_revision_requests },
        { label: 'Среднее число правок', value: formatNumber(data.revision.avg_revision_used) },
        { label: 'Доля доработок', value: formatPercent(data.revision.revision_rate) },
      ],
    },
    {
      label: 'Ссылки',
      icon: Link2,
      metrics: [
        { label: 'Ссылочных отчетов', value: data.links.link_reports },
        { label: 'Доступные ссылки', value: data.links.reachable_links },
        { label: 'Недоступные ссылки', value: data.links.unreachable_links },
        { label: 'Разрешенный домен', value: data.links.allowed_domain_links },
        { label: 'Успешность ссылок', value: formatPercent(data.links.link_success_rate) },
      ],
    },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <DashboardCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <InfoPanel title="Примененные фильтры" items={formatFilters(data.filters_applied)} />
        <InfoPanel
          title="Период"
          items={[
            { label: 'Дата с', value: formatDateTime(data.period.date_from) },
            { label: 'Дата по', value: formatDateTime(data.period.date_to) },
          ]}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Обновлено:{' '}
        <span className="font-medium text-slate-900">{formatDateTime(data.updated_at)}</span>
      </div>
    </section>
  );
}

function DashboardCard({
  label,
  metrics,
  icon: Icon,
}: {
  label: string;
  metrics: Array<{ label: string; value: React.ReactNode }>;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#eef1ff] text-[#465cd3]">
          <Icon className="size-5" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h3>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">{metric.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</div>
          </div>
        ))}
      </div>
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

function createInitialFilters(): DashboardFilters {
  const now = new Date();
  const dateFrom = new Date(now);
  const dateTo = new Date(now);
  dateFrom.setMonth(dateFrom.getMonth() - 3);

  return {
    date_from: dateFrom.toISOString(),
    date_to: dateTo.toISOString(),
    period_type: 'assignment_created',
    region_ids: [],
    task_ids: [],
    org_unit_ids: [],
    user_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
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

function formatFilters(filters: AnalyticsDashboardResponse['filters_applied']) {
  return [
    { label: 'Дата с', value: formatDateTime(filters.date_from) },
    { label: 'Дата по', value: formatDateTime(filters.date_to) },
    { label: 'Тип периода', value: getOptionLabel(periodTypeOptions, filters.period_type) },
    { label: 'Регионы', value: formatArray(filters.region_ids) },
    { label: 'Задачи', value: formatArray(filters.task_ids) },
    { label: 'Структуры подчинения', value: formatArray(filters.org_unit_ids) },
    { label: 'Пользователи', value: formatArray(filters.user_ids) },
    { label: 'Типы задач', value: formatOptions(taskTypeOptions, filters.task_types) },
    { label: 'Масштаб', value: formatOptions(taskScopeOptions, filters.task_scope) },
    { label: 'Типы отчетов', value: formatOptions(reportTypeOptions, filters.report_types) },
    { label: 'Архивные задачи', value: filters.include_archived_tasks ? 'Да' : 'Нет' },
    { label: 'Удаленные назначения', value: filters.include_removed_assignments ? 'Да' : 'Нет' },
    { label: 'Только текущая версия', value: filters.only_current_report_version ? 'Да' : 'Нет' },
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
