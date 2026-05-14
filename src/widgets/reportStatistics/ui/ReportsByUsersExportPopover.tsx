import type {
  DashboardPeriodType,
  ReportAnalyticsAssignmentStatus,
  ReportsByUsersPayload,
} from '@/entities/analytics/model/types';
import { createReportsByUsersExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsByUsersExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsByUsersPayload;
  regionOptions: ExportSelectOption[];
  orgUnitOptions: ExportSelectOption[];
  userOptions: ExportSelectOption[];
  roleOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  taskStatusOptions: ExportSelectOption[];
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  assignmentStatusOptions: Array<{ value: ReportAnalyticsAssignmentStatus; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const usersExportColumns = [
  'user_id',
  'user_display_name',
  'user_status',
  'role_name',
  'region_name',
  'org_unit_name',
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
  'revision_rate',
  'problem_level',
];

export function ReportsByUsersExportPopover({
  tableFilters,
  regionOptions,
  orgUnitOptions,
  userOptions,
  roleOptions,
  taskOptions,
  periodTypeOptions,
  taskTypeOptions,
  taskScopeOptions,
  taskStatusOptions,
  reportTypeOptions,
  assignmentStatusOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsByUsersExportFilters>
      title="Экспорт статистики по исполнителям"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsByUsersExport({
          exportType: 'analytics_by_users',
          format: 'xlsx',
          filters,
          columns: usersExportColumns,
          asyncMode: true,
        })
      }
      fields={[
        { kind: 'date', key: 'date_from', label: 'Дата с' },
        { kind: 'date', key: 'date_to', label: 'Дата по' },
        { kind: 'select', key: 'period_type', label: 'Тип периода', options: periodTypeOptions },
        { kind: 'multi-search', key: 'region_ids', label: 'Регионы', placeholder: 'Все регионы', searchPlaceholder: 'Поиск региона', options: regionOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'org_unit_ids', label: 'Оргструктуры', placeholder: 'Все оргструктуры', searchPlaceholder: 'Поиск оргструктуры', options: orgUnitOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'user_ids', label: 'Пользователи', placeholder: 'Все пользователи', searchPlaceholder: 'Поиск пользователя', options: userOptions, valueType: 'number' },
        { kind: 'multi', key: 'role_ids', label: 'Роли', placeholder: 'Все роли', options: roleOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'task_ids', label: 'Задачи', placeholder: 'Все задачи', searchPlaceholder: 'Поиск по id или названию', options: taskOptions, valueType: 'number' },
        { kind: 'multi', key: 'task_types', label: 'Тип задачи', placeholder: 'Все типы', options: taskTypeOptions },
        { kind: 'multi', key: 'task_scope', label: 'Масштаб задачи', placeholder: 'Любой масштаб', options: taskScopeOptions },
        { kind: 'multi', key: 'task_statuses', label: 'Статус задачи', placeholder: 'Все статусы', options: taskStatusOptions },
        { kind: 'multi', key: 'report_types', label: 'Тип отчета', placeholder: 'Все типы отчетов', options: reportTypeOptions },
        { kind: 'multi', key: 'assignment_statuses', label: 'Статус назначения', placeholder: 'Все статусы', options: assignmentStatusOptions },
        {
          kind: 'select',
          key: 'sort_by',
          label: 'Сортировка',
          options: [
            { value: 'not_completed_rate', label: 'Доля невыполненных' },
            { value: 'completion_rate', label: 'Выполнение' },
          ],
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
        { kind: 'boolean', key: 'include_inactive_users', label: 'Включать неактивных пользователей' },
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsByUsersExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'assignment_created',
    region_ids: [],
    org_unit_ids: [],
    user_ids: [],
    role_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    task_statuses: [],
    report_types: [],
    assignment_statuses: [],
    include_inactive_users: false,
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
    sort_by: 'not_completed_rate',
    sort_direction: 'desc',
  };
}

function toExportFilters(tableFilters: unknown): ReportsByUsersExportFilters {
  const { page: _page, page_size: _pageSize, ...filters } = tableFilters as ReportsByUsersPayload;
  return {
    ...filters,
    assignment_statuses: [],
  };
}
