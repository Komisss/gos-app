import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import type { ReportStatus } from '@/entities/report/model/types';
import { getTaskById } from '@/entities/task/api/tasks';
import { ReportRegistry } from '@/widgets/reportRegistry/ui/ReportRegistry';

export default function TaskRegionReportsPage() {
  const [searchParams] = useSearchParams();
  const taskId = toPositiveNumber(searchParams.get('task_id'));
  const regionId = toPositiveNumber(searchParams.get('region_id'));
  const reportStatus = normalizeReportStatus(searchParams.get('report_status'));
  const taskQuery = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => getTaskById(taskId ?? 0),
    enabled: Boolean(taskId),
  });

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
      overdue: 'false',
      has_report: true,
      only_current_version: true,
      include_removed: false,
      page: 1,
      page_size: 50,
      sort_by: 'submitted_at',
      sort_direction: 'desc' as const,
    };
  }, [regionId, reportStatus, taskId]);
  const taskAssignmentUserOptions = useMemo(() => {
    const assignments = taskQuery.data?.taskAssignments ?? [];
    const usersById = new Map<number, { value: string; label: string; description?: string }>();

    assignments.forEach((assignment) => {
      if (
        !assignment.user_id ||
        usersById.has(assignment.user_id) ||
        (regionId !== null && assignment.region_id !== regionId)
      ) {
        return;
      }

      usersById.set(assignment.user_id, {
        value: String(assignment.user_id),
        label: assignment.user_full_name,
        description: [assignment.username ? `@${assignment.username}` : null, assignment.region_name]
          .filter(Boolean)
          .join(' • '),
      });
    });

    return Array.from(usersById.values());
  }, [regionId, taskQuery.data?.taskAssignments]);

  return (
    <ReportRegistry
      title="Отчеты по региону"
      description="Отчеты по выбранной задаче и региону."
      initialFilters={filters}
      autoLoad={Boolean(taskId && regionId)}
      statusFilterOnly
      showHeaderActions={false}
      showBulkActions={false}
      tableVariant="task-region"
      userOptionsOverride={taskAssignmentUserOptions}
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
    'accepted',
    'revision_requested',
    'not_completed',
  ];

  if (value === 'under_review') {
    return 'pending';
  }

  return availableStatuses.includes(value as ReportStatus) ? (value as ReportStatus) : 'pending';
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
