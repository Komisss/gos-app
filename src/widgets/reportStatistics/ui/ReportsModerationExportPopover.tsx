import type { DashboardPeriodType, ReportsModerationPayload } from '@/entities/analytics/model/types';
import { createReportsModerationExport } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ReportsModerationExportFilters } from '@/entities/export/model/types';
import type { ReportTaskScope, ReportType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsModerationPayload;
  regionOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  periodTypeOptions: Array<{ value: DashboardPeriodType; label: string }>;
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const moderationExportColumns = [
  'task_id',
  'task_name',
  'report_id',
  'task_assignment_id',
  'report_type',
  'report_status',
  'submission_date',
  'moderation_action',
  'action_date',
  'revision_count',
  'completion_time',
  'is_overdue',
  'is_accepted',
];

export function ReportsModerationExportPopover({
  tableFilters,
  regionOptions,
  taskOptions,
  periodTypeOptions,
  taskScopeOptions,
  reportTypeOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsModerationExportFilters>
      title="Экспорт статистики по модерации"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsModerationExport({
          exportType: 'analytics_moderation',
          format: 'xlsx',
          filters,
          columns: moderationExportColumns,
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
        { kind: 'number', key: 'page', label: 'Страница', min: 1 },
        { kind: 'number', key: 'page_size', label: 'Размер страницы', min: 1 },
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsModerationExportFilters {
  return {
    date_from: '',
    date_to: '',
    period_type: 'moderation_action',
    region_ids: [],
    task_ids: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
    page: 1,
    page_size: 50,
  };
}

function toExportFilters(tableFilters: unknown): ReportsModerationExportFilters {
  return tableFilters as ReportsModerationPayload;
}
