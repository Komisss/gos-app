import type { ReportTaskScope, ReportTaskType, ReportType } from '@/entities/report/model/types';

export type DashboardPeriodType =
  | 'assignment_created'
  | 'deadline'
  | 'report_submitted'
  | 'moderation_action';

export type AnalyticsDashboardPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  task_ids: number[];
  org_unit_ids: number[];
  user_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
};

export type AnalyticsDashboardResponse = {
  filters_applied: AnalyticsDashboardPayload & {
    source?: string;
  };
  period: {
    date_from: string;
    date_to: string;
  };
  kpi: {
    total_assignments: number;
    assignments_with_reports: number;
    assignments_without_reports: number;
    total_reports: number;
    accepted_reports: number;
    under_review_reports: number;
    revision_requested_reports: number;
    not_completed_assignments: number;
  };
  completion: {
    completion_rate: number;
    report_submission_rate: number;
    not_completed_rate: number;
  };
  moderation: {
    moderated_reports: number;
    accepted_by_moderation: number;
    revision_requested_by_moderation: number;
    pending_moderation: number;
    moderation_acceptance_rate: number;
    moderation_revision_rate: number;
  };
  overdue: {
    overdue_assignments: number;
    overdue_without_report: number;
    overdue_with_report: number;
    overdue_rate: number;
  };
  revision: {
    assignments_with_revision: number;
    total_revision_requests: number;
    avg_revision_used: number;
    revision_rate: number;
  };
  links: {
    link_reports: number;
    reachable_links: number;
    unreachable_links: number;
    allowed_domain_links: number;
    link_success_rate: number;
  };
  updated_at: string;
};
