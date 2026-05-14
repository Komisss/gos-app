import type {
  DashboardPeriodType,
  LinkValidationGroupBy,
  LinkValidationReportStatus,
  ReportsLinkValidationPayload,
} from '@/entities/analytics/model/types';
import { createReportsLinkValidationExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsLinkValidationExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportTaskType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsLinkValidationPayload;
  regionOptions: ExportSelectOption[];
  orgUnitOptions: ExportSelectOption[];
  userOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType | 'link_checked'; label: string }>;
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportStatusOptions: Array<{ value: LinkValidationReportStatus; label: string }>;
  groupByOptions: Array<{ value: LinkValidationGroupBy; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const validationStatusOptions = [
  { value: 'success', label: 'Успешно' },
  { value: 'unreachable', label: 'Недоступно' },
  { value: 'domain_not_allowed', label: 'Домен запрещен' },
  { value: 'technical_error', label: 'Техническая ошибка' },
  { value: 'not_checked', label: 'Не проверено' },
];

const linkValidationExportColumns = [
  'group_key',
  'group_name',
  'link_reports',
  'checked_reports',
  'not_checked_reports',
  'success_count',
  'unreachable_count',
  'domain_not_allowed_count',
  'http_error_count',
  'technical_error_count',
  'problem_count',
  'success_rate',
  'problem_rate',
  'not_checked_rate',
];

export function ReportsLinkValidationExportPopover({
  tableFilters,
  regionOptions,
  orgUnitOptions,
  userOptions,
  taskOptions,
  periodTypeOptions,
  taskTypeOptions,
  taskScopeOptions,
  reportStatusOptions,
  groupByOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsLinkValidationExportFilters>
      title="Экспорт статистики по ссылочным отчетам"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsLinkValidationExport({
          exportType: 'analytics_link_validation',
          format: 'xlsx',
          filters,
          columns: linkValidationExportColumns,
          asyncMode: true,
        })
      }
      fields={[
        { kind: 'date', key: 'date_from', label: 'Дата с' },
        { kind: 'date', key: 'date_to', label: 'Дата по' },
        { kind: 'select', key: 'period_type', label: 'Тип периода', options: periodTypeOptions },
        { kind: 'select', key: 'group_by', label: 'Группировка', options: groupByOptions },
        { kind: 'multi-search', key: 'region_ids', label: 'Регионы', placeholder: 'Все регионы', searchPlaceholder: 'Поиск региона', options: regionOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'org_unit_ids', label: 'Оргструктуры', placeholder: 'Все оргструктуры', searchPlaceholder: 'Поиск оргструктуры', options: orgUnitOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'user_ids', label: 'Пользователи', placeholder: 'Все пользователи', searchPlaceholder: 'Поиск пользователя', options: userOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'task_ids', label: 'Задачи', placeholder: 'Все задачи', searchPlaceholder: 'Поиск по id или названию', options: taskOptions, valueType: 'number' },
        { kind: 'multi', key: 'task_scope', label: 'Масштаб задачи', placeholder: 'Любой масштаб', options: taskScopeOptions },
        { kind: 'multi', key: 'task_types', label: 'Тип задачи', placeholder: 'Все типы', options: taskTypeOptions },
        { kind: 'multi', key: 'report_statuses', label: 'Статус отчета', placeholder: 'Все статусы', options: reportStatusOptions },
        { kind: 'multi', key: 'validation_statuses', label: 'Статусы валидации', placeholder: 'Все статусы', options: validationStatusOptions },
        { kind: 'text-list', key: 'domains', label: 'Домены', placeholder: 'Например: vk.com, t.me' },
        {
          kind: 'select',
          key: 'sort_by',
          label: 'Сортировка',
          options: [{ value: 'problem_count', label: 'Количество проблем' }],
        },
        {
          kind: 'select',
          key: 'sort_direction',
          label: 'Направление',
          options: [
            { value: 'desc', label: 'По убыванию' },
            { value: 'asc', label: 'По возрастанию' },
          ],
        },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
        { kind: 'boolean', key: 'include_reports_without_validation', label: 'Включать отчеты без валидации' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsLinkValidationExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'link_checked',
    region_ids: [],
    org_unit_ids: [],
    user_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    report_statuses: [],
    validation_statuses: [],
    domains: [],
    only_current_report_version: true,
    include_reports_without_validation: true,
    group_by: 'status',
    sort_by: 'problem_count',
    sort_direction: 'desc',
  };
}

function toExportFilters(tableFilters: unknown): ReportsLinkValidationExportFilters {
  const {
    page: _page,
    page_size: _pageSize,
    role_ids: _roleIds,
    include_inactive_users: _includeInactiveUsers,
    include_archived_tasks: _includeArchivedTasks,
    include_removed_assignments: _includeRemovedAssignments,
    ...filters
  } = tableFilters as ReportsLinkValidationPayload;

  return filters;
}
