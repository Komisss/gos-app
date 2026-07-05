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

export type RegionDashboardResponse = {
  region: {
    id: number;
    name: string;
    external_code: number | null;
  };
  regional_manager: {
    id: number;
    full_name: string;
    phone: string | null;
    email: string | null;
    status: string;
    role_code: string;
    region_id: number;
    org_unit_id: number | null;
  } | null;
  period: {
    date_from: string;
    date_to: string;
    date_field: string;
  };
  kpe: {
    region_kpe: number;
    region_fact: number;
    region_fact_percent: number;
  };
  summary: {
    region_users_count: number;
    total_assignments: number;
    accepted_reports: number;
    completed_tasks_percent: number;
    online_tasks_count: number;
    online_assignments_count: number;
    online_accepted_reports_count: number;
    online_accepted_reports_percent: number;
    street_tasks_count: number;
    street_people_count: number;
    street_unique_people_count: number;
  };
  street: {
    street_tasks_count: number;
    street_people_count: number;
    street_unique_people_count: number;
    tasks: Array<{
      task_id: number;
      task_title: string;
      task_type: ReportTaskType;
      task_subtype: string | null;
      online_task_subtype: string | null;
      people_count: number;
      unique_people_count: number;
    }>;
  };
  online: {
    online_tasks_count: number;
    online_assignments_count: number;
    online_reports_count: number;
    online_accepted_reports_count: number;
    online_accepted_reports_percent: number;
    tasks: Array<{
      task_id: number;
      task_title: string;
      task_type: ReportTaskType;
      task_subtype: string | null;
      online_task_subtype: string | null;
      assignments_count: number;
      reports_count: number;
      accepted_reports_count: number;
      accepted_reports_percent: number;
    }>;
  };
  filters_applied: {
    region_id: number;
    date_from: string;
    date_to: string;
    period_type: DashboardPeriodType | null;
    task_ids: number[];
    org_unit_ids: number[];
    user_ids: number[];
    task_types: ReportTaskType[];
    task_scope: ReportTaskScope[];
    report_types: ReportType[];
    source: string;
  };
  updated_at: string;
};

export type ReportAnalyticsTaskStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';

export type ReportAnalyticsAssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'under_review'
  | 'revision_requested'
  | 'accepted'
  | 'not_completed';

export type SortDirection = 'asc' | 'desc';

export type ReportsByOrgUnitsPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  include_child_org_units: boolean;
  org_unit_depth: number;
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  task_statuses: ReportAnalyticsTaskStatus[];
  report_types: ReportType[];
  assignment_statuses: ReportAnalyticsAssignmentStatus[];
  include_inactive_org_units: boolean;
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  sort_by: string;
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsByRegionsPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  assignment_statuses: ReportAnalyticsAssignmentStatus[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  sort_by: 'not_completed_rate' | 'completion_rate';
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsByTasksPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  user_ids: number[];
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  task_statuses: ReportAnalyticsTaskStatus[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  sort_by: 'not_completed_rate' | 'completion_rate';
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsByUserPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  user_id: number | null;
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  page: number;
  page_size: number;
};

export type ReportsByUsersPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  user_ids: number[];
  role_ids: number[];
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  task_statuses: ReportAnalyticsTaskStatus[];
  report_types: ReportType[];
  include_inactive_users: boolean;
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  sort_by: 'not_completed_rate' | 'completion_rate';
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsByDeadlinesPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  task_ids: number[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  page: number;
  page_size: number;
};

export type ReportsModerationPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  task_ids: number[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  page: number;
  page_size: number;
};

export type NotCompletedGroupBy = 'region' | 'task' | 'org_unit' | 'user' | 'reason' | 'day' | 'month';

export type ReportsNotCompletedPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  user_ids: number[];
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  assignment_statuses: ReportAnalyticsAssignmentStatus[];
  not_completed_reason_codes: string[];
  only_overdue: boolean;
  only_not_completed: boolean;
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  group_by: NotCompletedGroupBy;
  sort_by: 'not_completed_assignments';
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsReturnedForRevisionPayload = {
  date_from: string;
  date_to: string;
  region_ids: number[];
  user_ids: number[];
  task_ids: number[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  only_current_report_version: boolean;
  page: number;
  page_size: number;
};

export type LinkValidationGroupBy = 'region' | 'task' | 'org_unit' | 'user' | 'domain' | 'status' | 'day' | 'month';

export type LinkValidationReportStatus =
  | 'pending'
  | 'accepted'
  | 'revision_requested'
  | 'not_completed';

export type ReportsLinkValidationPayload = {
  date_from: string;
  date_to: string;
  period_type: DashboardPeriodType;
  region_ids: number[];
  org_unit_ids: number[];
  user_ids: number[];
  role_ids: number[];
  task_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  report_statuses: LinkValidationReportStatus[];
  validation_statuses: string[];
  domains: string[];
  only_current_report_version: boolean;
  include_reports_without_validation: boolean;
  group_by: LinkValidationGroupBy;
  include_inactive_users: boolean;
  include_archived_tasks: boolean;
  include_removed_assignments: boolean;
  sort_by: 'problem_count';
  sort_direction: SortDirection;
  page: number;
  page_size: number;
};

export type ReportsByOrgUnitsResponse = {
  filters_applied: Omit<ReportsByOrgUnitsPayload, 'page' | 'page_size'>;
  period: {
    date_from: string;
    date_to: string;
  };
  items: ReportsByOrgUnitsItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsByOrgUnitsTotals;
  updated_at: string;
};

export type ReportsByRegionsResponse = Omit<ReportsByOrgUnitsResponse, 'filters_applied'> & {
  filters_applied: Omit<ReportsByRegionsPayload, 'page' | 'page_size' | 'assignment_statuses'> & {
    assignment_statuses?: ReportAnalyticsAssignmentStatus[];
    source?: string;
  };
  items: ReportsByRegionsItem[];
  totals: ReportsByRegionsTotals;
};

export type ReportsByRegionsItem = {
  region_id: number | null;
  region_name: string | null;
  kpe: number;
  done: number;
  done_kpe_percent: number;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  moderation_acceptance_rate: number;
  avg_revision_used: number;
  rank: number;
  problem_level?: string;
};

export type ReportsByRegionsTotals = {
  kpe: number;
  done: number;
  done_kpe_percent: number;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  moderation_acceptance_rate: number;
};

export type ReportsByTasksResponse = Omit<ReportsByOrgUnitsResponse, 'filters_applied' | 'items' | 'totals'> & {
  filters_applied: Omit<ReportsByTasksPayload, 'page' | 'page_size'> & {
    source?: string;
  };
  items: ReportsByTasksItem[];
  totals: ReportsByTasksTotals;
};

export type ReportsByTasksItem = {
  task_id: number;
  task_title: string;
  task_scope: string;
  task_type: string;
  task_status: string;
  report_format: string;
  created_at: string;
  deadline_at: string;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  moderation_acceptance_rate: number;
  avg_revision_used: number;
  problem_level: string;
};

export type ReportsByTasksTotals = {
  total_tasks: number;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
};

export type ReportsByUserResponse = Omit<ReportsByOrgUnitsResponse, 'filters_applied' | 'items' | 'totals'> & {
  filters_applied: {
    user_id: number | null;
    date_from: string;
    date_to: string;
    period_type: DashboardPeriodType;
    task_scope: ReportTaskScope[];
    report_types: ReportType[];
    include_archived_tasks: boolean;
    include_removed_assignments: boolean;
    only_current_report_version: boolean;
  };
  items: ReportsByUserItem[];
  totals: ReportsByUserTotals;
};

export type ReportsByUserItem = {
  task_id: number;
  task_name: string;
  report_id: number;
  task_assignment_id: number;
  report_type: string;
  report_status: string;
  submission_date: string;
  revision_count: number;
  completion_time: number;
  is_overdue: boolean;
  is_accepted: boolean;
};

export type ReportsByUserTotals = {
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  completion_rate: number;
  submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
};

export type ReportsByUsersResponse = Omit<ReportsByOrgUnitsResponse, 'filters_applied' | 'items' | 'totals'> & {
  filters_applied: Omit<ReportsByUsersPayload, 'page' | 'page_size'> & {
    assignment_statuses?: ReportAnalyticsAssignmentStatus[];
    source?: string;
  };
  items: ReportsByUsersItem[];
  totals: ReportsByUsersTotals;
};

export type ReportsByUsersItem = {
  user_id: number;
  user_display_name: string;
  user_status: string;
  role_id: number | null;
  role_name: string | null;
  region_id: number | null;
  region_name: string | null;
  org_unit_id: number | null;
  org_unit_name: string | null;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  deactivated_not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  avg_revision_used: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  revision_rate: number;
  problem_level: string;
};

export type ReportsByUsersTotals = {
  total_users: number;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  deactivated_not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  revision_rate: number;
};

export type ReportsByDeadlinesResponse = {
  filters_applied: Omit<ReportsByDeadlinesPayload, 'page' | 'page_size'>;
  period: {
    date_from: string;
    date_to: string;
  };
  items: ReportsByDeadlinesItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsByDeadlinesTotals;
  updated_at: string;
};

export type ReportsByDeadlinesItem = {
  task_assignment_id: number;
  task_id: number;
  task_name: string;
  user_id: number;
  region_id: number | null;
  deadline_at: string | null;
  assignment_status: string;
  has_report: boolean;
  report_id: number | null;
  report_type: string | null;
  report_status: string | null;
  submission_date: string | null;
  submitted_before_deadline: boolean;
  submitted_after_deadline: boolean;
  is_overdue: boolean;
  is_accepted: boolean;
  days_until_deadline: number | null;
  delay_days: number | null;
  completion_time: number | null;
};

export type ReportsByDeadlinesTotals = {
  total_assignments: number;
  assignments_with_deadline: number;
  assignments_without_deadline: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  overdue_assignments: number;
  submitted_before_deadline: number;
  submitted_after_deadline: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  deadline_success_rate: number;
  overdue_rate: number;
  late_submission_rate: number;
  avg_delay_days: number;
  avg_completion_time: number;
};

export type ReportsLinkValidationResponse = {
  filters_applied: Omit<ReportsLinkValidationPayload, 'page' | 'page_size' | 'role_ids' | 'include_inactive_users' | 'include_archived_tasks' | 'include_removed_assignments'> & {
    role_ids?: number[];
    include_inactive_users?: boolean;
    include_archived_tasks?: boolean;
    include_removed_assignments?: boolean;
  };
  period: {
    date_from: string;
    date_to: string;
  };
  group_by: LinkValidationGroupBy;
  items: ReportsLinkValidationItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsLinkValidationTotals;
  updated_at: string;
};

export type ReportsLinkValidationItem = {
  group_key: string;
  group_name: string;
  link_reports: number;
  checked_reports: number;
  not_checked_reports: number;
  success_count: number;
  unreachable_count: number;
  domain_not_allowed_count: number;
  http_error_count: number;
  technical_error_count: number;
  problem_count: number;
  success_rate: number;
  problem_rate: number;
  not_checked_rate: number;
};

export type ReportsLinkValidationTotals = Omit<ReportsLinkValidationItem, 'group_key' | 'group_name'>;

export type ReportsModerationResponse = {
  filters_applied: Omit<ReportsModerationPayload, 'page' | 'page_size'>;
  period: {
    date_from: string;
    date_to: string;
  };
  items: ReportsModerationItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsModerationTotals;
  updated_at: string;
};

export type ReportsModerationItem = {
  task_id: number;
  task_name: string;
  report_id: number;
  task_assignment_id: number;
  report_type: string;
  report_status: string;
  submission_date: string;
  moderation_action: string;
  action_date: string;
  revision_count: number;
  completion_time: number;
  is_overdue: boolean;
  is_accepted: boolean;
};

export type ReportsModerationTotals = {
  total_reports: number;
  accepted_reports: number;
  revision_requested_reports: number;
  under_review_reports: number;
  moderation_acceptance_rate: number;
  avg_revision_used: number;
  completion_rate: number;
  overdue_rate: number;
};

export type ReportsNotCompletedResponse = {
  filters_applied: Omit<ReportsNotCompletedPayload, 'page' | 'page_size'>;
  period: {
    date_from: string;
    date_to: string;
  };
  group_by: NotCompletedGroupBy;
  items: ReportsNotCompletedItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsNotCompletedTotals;
  updated_at: string;
};

export type ReportsNotCompletedItem = {
  group_key: string | number;
  group_name: string;
  total_assignments: number;
  overdue_assignments: number;
  not_completed_assignments: number;
  deactivated_not_completed_assignments: number;
  not_completed_without_report: number;
  not_completed_after_revision: number;
  assignments_under_review_after_deadline: number;
  overdue_rate: number;
  not_completed_rate: number;
  avg_days_overdue: number;
  max_days_overdue: number;
};

export type ReportsNotCompletedTotals = Omit<ReportsNotCompletedItem, 'group_key' | 'group_name'>;

export type ReportsReturnedForRevisionResponse = {
  filters_applied: Omit<ReportsReturnedForRevisionPayload, 'page' | 'page_size'>;
  period: {
    date_from: string;
    date_to: string;
  };
  items: ReportsReturnedForRevisionItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  totals: ReportsReturnedForRevisionTotals;
  updated_at: string;
};

export type ReportsReturnedForRevisionItem = ReportsModerationItem & {
  reason_id: number | null;
  reason_for_revision: string | null;
};

export type ReportsReturnedForRevisionTotals = {
  total_reports: number;
  accepted_reports: number;
  revision_requested_reports: number;
  completion_rate: number;
  overdue_rate: number;
  revision_rate: number;
};

export type ReportsByOrgUnitsItem = {
  org_unit_id: number;
  org_unit_name: string;
  parent_org_unit_id: number | null;
  parent_org_unit_name: string | null;
  org_unit_level: number;
  org_unit_path: string;
  org_unit_status: string;
  region_id: number | null;
  region_name: string | null;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  deactivated_not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  avg_revision_used: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  revision_rate: number;
  problem_level: string;
};

export type ReportsByOrgUnitsTotals = {
  total_org_units: number;
  total_assignments: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  accepted_assignments: number;
  not_completed_assignments: number;
  deactivated_not_completed_assignments: number;
  overdue_assignments: number;
  total_reports: number;
  accepted_reports: number;
  under_review_reports: number;
  revision_requested_reports: number;
  revision_requests: number;
  completion_rate: number;
  report_submission_rate: number;
  not_completed_rate: number;
  overdue_rate: number;
  revision_rate: number;
};
