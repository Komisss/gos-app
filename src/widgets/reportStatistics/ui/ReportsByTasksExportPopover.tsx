import type { DashboardPeriodType, ReportsByTasksPayload } from '@/entities/analytics/model/types';
import { createReportsByTasksExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsByTasksExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsByTasksPayload;
  regionOptions: ExportSelectOption[];
  orgUnitOptions: ExportSelectOption[];
  userOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskTypeOptions: Array<{ value: ReportTaskType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  taskStatusOptions: ExportSelectOption[];
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const tasksExportColumns = [
  'task_id',
  'task_title',
  'task_scope',
  'task_type',
  'task_status',
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
  'problem_level',
];

export function ReportsByTasksExportPopover({
  tableFilters,
  regionOptions,
  orgUnitOptions,
  userOptions,
  taskOptions,
  periodTypeOptions,
  taskTypeOptions,
  taskScopeOptions,
  taskStatusOptions,
  reportTypeOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsByTasksExportFilters>
      title="Экспорт статистики по задачам"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsByTasksExport({
          exportType: 'analytics_by_tasks',
          format: 'xlsx',
          filters,
          columns: tasksExportColumns,
          asyncMode: true,
        })
      }
      fields={[
        { kind: 'date', key: 'date_from', label: 'Дата с' },
        { kind: 'date', key: 'date_to', label: 'Дата по' },
        { kind: 'select', key: 'period_type', label: 'Тип периода', options: periodTypeOptions },
        { kind: 'multi-search', key: 'region_ids', label: 'Регионы', placeholder: 'Все регионы', searchPlaceholder: 'Поиск региона', options: regionOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'org_unit_ids', label: 'Структуры подчинения', placeholder: 'Все структуры подчинения', searchPlaceholder: 'Поиск структуры подчинения', options: orgUnitOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'user_ids', label: 'Пользователи', placeholder: 'Все пользователи', searchPlaceholder: 'Поиск пользователя', options: userOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'task_ids', label: 'Задачи', placeholder: 'Все задачи', searchPlaceholder: 'Поиск по id или названию', options: taskOptions, valueType: 'number' },
        { kind: 'multi', key: 'task_types', label: 'Тип задачи', placeholder: 'Все типы', options: taskTypeOptions },
        { kind: 'multi', key: 'task_scope', label: 'Масштаб задачи', placeholder: 'Любой масштаб', options: taskScopeOptions },
        { kind: 'multi', key: 'task_statuses', label: 'Статус задачи', placeholder: 'Все статусы', options: taskStatusOptions },
        { kind: 'multi', key: 'report_types', label: 'Тип отчета', placeholder: 'Все типы отчетов', options: reportTypeOptions },
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
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsByTasksExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'assignment_created',
    region_ids: [],
    org_unit_ids: [],
    user_ids: [],
    task_ids: [],
    task_types: [],
    task_scope: [],
    task_statuses: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
    sort_by: 'not_completed_rate',
    sort_direction: 'desc',
  };
}

function toExportFilters(tableFilters: unknown): ReportsByTasksExportFilters {
  const { page: _page, page_size: _pageSize, ...filters } = tableFilters as ReportsByTasksPayload;
  return filters;
}
