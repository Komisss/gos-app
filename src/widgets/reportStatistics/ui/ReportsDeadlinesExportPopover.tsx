import type { DashboardPeriodType, ReportsByDeadlinesPayload } from '@/entities/analytics/model/types';
import { createReportsDeadlinesExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsDeadlinesExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsByDeadlinesPayload;
  regionOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const deadlinesExportColumns = [
  'task_assignment_id',
  'task_id',
  'task_name',
  'user_id',
  'region_id',
  'deadline_at',
  'assignment_status',
  'has_report',
  'report_id',
  'report_type',
  'report_status',
  'submission_date',
  'submitted_before_deadline',
  'submitted_after_deadline',
  'is_overdue',
  'is_accepted',
  'days_until_deadline',
  'delay_days',
  'completion_time',
];

export function ReportsDeadlinesExportPopover({
  tableFilters,
  regionOptions,
  taskOptions,
  periodTypeOptions,
  taskScopeOptions,
  reportTypeOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsDeadlinesExportFilters>
      title="Экспорт статистики по дедлайнам отчетов"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsDeadlinesExport({
          exportType: 'analytics_deadlines',
          format: 'xlsx',
          filters,
          columns: deadlinesExportColumns,
          asyncMode: true,
        })
      }
      fields={[
        { kind: 'date', key: 'date_from', label: 'Дата с' },
        { kind: 'date', key: 'date_to', label: 'Дата по' },
        { kind: 'select', key: 'period_type', label: 'Тип периода', options: periodTypeOptions },
        { kind: 'multi-search', key: 'region_ids', label: 'Регионы', placeholder: 'Все регионы', searchPlaceholder: 'Поиск региона', options: regionOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'task_ids', label: 'Задачи', placeholder: 'Все задачи', searchPlaceholder: 'Поиск по id или названию', options: taskOptions, valueType: 'number' },
        { kind: 'multi', key: 'task_scope', label: 'Масштаб задачи', placeholder: 'Любой масштаб', options: taskScopeOptions },
        { kind: 'multi', key: 'report_types', label: 'Тип отчета', placeholder: 'Все типы отчетов', options: reportTypeOptions },
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsDeadlinesExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'deadline',
    region_ids: [],
    task_ids: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
  };
}

function toExportFilters(tableFilters: unknown): ReportsDeadlinesExportFilters {
  const { page: _page, page_size: _pageSize, ...filters } = tableFilters as ReportsByDeadlinesPayload;
  return filters;
}
