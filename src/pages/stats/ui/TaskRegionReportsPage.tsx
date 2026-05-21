import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ReportStatus } from '@/entities/report/model/types';
import { ReportRegistry } from '@/widgets/reportRegistry/ui/ReportRegistry';

export default function TaskRegionReportsPage() {
  const [searchParams] = useSearchParams();
  const taskId = toPositiveNumber(searchParams.get('task_id'));
  const regionId = toPositiveNumber(searchParams.get('region_id'));
  const reportStatus = normalizeReportStatus(searchParams.get('report_status'));

  const filters = useMemo(() => {
    const dateRange = createTenYearDateRange();

    return {
      task_ids: taskId ? [taskId] : [],
      region_ids: regionId ? [regionId] : [],
      report_statuses: [reportStatus],
      submitted_from: dateRange.from,
      submitted_to: dateRange.to,
      deadline_from: dateRange.from,
      deadline_to: dateRange.to,
      created_from: dateRange.from,
      created_to: dateRange.to,
      is_overdue: false,
      has_report: true,
      only_current_version: true,
      include_removed: false,
      page: 1,
      page_size: 50,
      sort_by: 'submitted_at',
      sort_direction: 'desc' as const,
    };
  }, [regionId, reportStatus, taskId]);

  return (
    <ReportRegistry
      title="Отчеты по региону"
      description="Отчеты по выбранной задаче и региону."
      initialFilters={filters}
      autoLoad={Boolean(taskId && regionId)}
      statusFilterOnly
      showHeaderActions={false}
      showBulkActions={false}
      emptyStateText="В URL не переданы id задачи и региона."
    />
  );
}

function toPositiveNumber(value: string | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeReportStatus(value: string | null): ReportStatus {
  const availableStatuses: ReportStatus[] = [
    'pending',
    'under_review',
    'accepted',
    'revision_requested',
    'not_completed',
  ];

  return availableStatuses.includes(value as ReportStatus) ? (value as ReportStatus) : 'under_review';
}

function createTenYearDateRange() {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  from.setFullYear(from.getFullYear() - 10);
  to.setFullYear(to.getFullYear() + 10);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
