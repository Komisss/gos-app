import type { ReportsReturnedForRevisionPayload } from '@/entities/analytics/model/types';
import { createReportsReturnedForRevisionExport } from '@/entities/export/api/exports';
import type {
  ExportCreateResponse,
  ReportsReturnedForRevisionExportFilters,
} from '@/entities/export/model/types';
import type { ReportTaskScope, ReportType } from '@/entities/report/model/types';
import { ReportStatisticsExportPopover, type ExportSelectOption } from './ReportStatisticsExportPopover';

type Props = {
  tableFilters: ReportsReturnedForRevisionPayload;
  regionOptions: ExportSelectOption[];
  userOptions: ExportSelectOption[];
  taskOptions: ExportSelectOption[];
  taskScopeOptions: Array<{ value: ReportTaskScope; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

const returnedForRevisionExportColumns = [
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
  'reason_id',
  'reason_for_revision',
  'completion_time',
  'is_overdue',
  'is_accepted',
];

export function ReportsReturnedForRevisionExportPopover({
  tableFilters,
  regionOptions,
  userOptions,
  taskOptions,
  taskScopeOptions,
  reportTypeOptions,
  onExportStarted,
}: Props) {
  return (
    <ReportStatisticsExportPopover<ReportsReturnedForRevisionExportFilters>
      title="Экспорт статистики по возвращенным на доработку"
      tableFilters={tableFilters}
      createEmptyFilters={createEmptyExportFilters}
      toExportFilters={toExportFilters}
      onExportStarted={onExportStarted}
      createExport={(filters) =>
        createReportsReturnedForRevisionExport({
          exportType: 'analytics_returned_for_revision',
          format: 'xlsx',
          filters,
          columns: returnedForRevisionExportColumns,
          asyncMode: true,
        })
      }
      fields={[
        { kind: 'date', key: 'date_from', label: 'Дата с' },
        { kind: 'date', key: 'date_to', label: 'Дата по' },
        { kind: 'multi-search', key: 'region_ids', label: 'Регионы', placeholder: 'Все регионы', searchPlaceholder: 'Поиск региона', options: regionOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'user_ids', label: 'Пользователи', placeholder: 'Все пользователи', searchPlaceholder: 'Поиск пользователя', options: userOptions, valueType: 'number' },
        { kind: 'multi-search', key: 'task_ids', label: 'Задачи', placeholder: 'Все задачи', searchPlaceholder: 'Поиск по id или названию', options: taskOptions, valueType: 'number' },
        { kind: 'multi', key: 'task_scope', label: 'Уровень задачи', placeholder: 'Любой уровень', options: taskScopeOptions },
        { kind: 'multi', key: 'report_types', label: 'Тип отчета', placeholder: 'Все типы отчетов', options: reportTypeOptions },
        { kind: 'boolean', key: 'include_archived_tasks', label: 'Включать архивные задачи' },
        { kind: 'boolean', key: 'include_removed_assignments', label: 'Включать удаленные назначения' },
        { kind: 'boolean', key: 'only_current_report_version', label: 'Только текущая версия отчета' },
      ]}
    />
  );
}

function createEmptyExportFilters(): ReportsReturnedForRevisionExportFilters {
  return {
    date_from: '',
    date_to: '',
    region_ids: [],
    user_ids: [],
    task_ids: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
  };
}

function toExportFilters(tableFilters: unknown): ReportsReturnedForRevisionExportFilters {
  const { page: _page, page_size: _pageSize, ...filters } = tableFilters as ReportsReturnedForRevisionPayload;
  return filters;
}
