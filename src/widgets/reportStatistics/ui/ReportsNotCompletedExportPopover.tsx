import type {
  DashboardPeriodType,
  NotCompletedGroupBy,
  ReportAnalyticsAssignmentStatus,
  ReportsNotCompletedPayload,
} from '@/entities/analytics/model/types';
import { createReportsNotCompletedExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsNotCompletedExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportTaskType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsNotCompletedPayload;
  regionOptions: ExportSelectOption[];
  orgUnitOptions: ExportSelectOption[];
  userOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  assignmentStatusOptions: Array<{ value: ReportAnalyticsAssignmentStatus | 'deactivated_not_completed'; label: string }>;
  groupByOptions: Array<{ value: NotCompletedGroupBy; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const notCompletedExportColumns = [
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

export function ReportsNotCompletedExportPopover({
  tableFilters,
  regionOptions,
  orgUnitOptions,
  userOptions,
  taskOptions,
  periodTypeOptions,
  taskTypeOptions,
  taskScopeOptions,
  assignmentStatusOptions,
  groupByOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsNotCompletedExportFilters>
      title="Экспорт статистики по невыполненным назначениям"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsNotCompletedExport({
          exportType: 'analytics_overdue_not_completed',
          format: 'xlsx',
          filters,
          columns: notCompletedExportColumns,
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
        { kind: 'multi', key: 'task_types', label: 'Тип задачи', placeholder: 'Все типы', options: taskTypeOptions },
        { kind: 'multi', key: 'task_scope', label: 'Масштаб задачи', placeholder: 'Любой масштаб', options: taskScopeOptions },
        { kind: 'multi', key: 'assignment_statuses', label: 'Статус назначения', placeholder: 'Все статусы', options: assignmentStatusOptions },
        { kind: 'text-list', key: 'not_completed_reason_codes', label: 'Причины невыполнения', placeholder: 'Например: NO_REPORT_SUBMITTED_BEFORE_DEADLINE' },
        {
          kind: 'select',
          key: 'sort_by',
          label: 'Сортировка',
          options: [{ value: 'not_completed_assignments', label: 'Невыполненные назначения' }],
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
        { kind: 'boolean', key: 'only_overdue', label: 'Только просроченные назначения' },
        { kind: 'boolean', key: 'only_not_completed', label: 'Только невыполненные назначения' },
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsNotCompletedExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'deadline',
    region_ids: [],
    org_unit_ids: [],
    user_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    assignment_statuses: [],
    not_completed_reason_codes: [],
    only_overdue: false,
    only_not_completed: true,
    include_archived_tasks: false,
    include_removed_assignments: false,
    group_by: 'reason',
    sort_by: 'not_completed_assignments',
    sort_direction: 'desc',
  };
}

function toExportFilters(tableFilters: unknown): ReportsNotCompletedExportFilters {
  const { page: _page, page_size: _pageSize, ...filters } = tableFilters as ReportsNotCompletedPayload;
  return filters;
}
