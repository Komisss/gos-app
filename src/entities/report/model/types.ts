export type ReportTaskType = 'online_action' | 'street_action';
export type ReportTaskScope = 'federal' | 'regional';
export type ReportType = 'link' | 'image';
export type ReportStatus = 'under_review' | 'accepted' | 'revision_requested' | 'not_completed';
export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'under_review'
  | 'revision_requested'
  | 'accepted'
  | 'not_completed';

export type ReportSearchPayload = {
  search: string;
  region_ids: number[];
  task_ids: number[];
  user_ids: number[];
  org_unit_ids: number[];
  role_ids: number[];
  task_types: ReportTaskType[];
  task_scope: ReportTaskScope[];
  report_types: ReportType[];
  report_statuses: ReportStatus[];
  assignment_statuses: AssignmentStatus[];
  submitted_from: string | null;
  submitted_to: string | null;
  deadline_from: string | null;
  deadline_to: string | null;
  created_from: string | null;
  created_to: string | null;
  is_overdue: boolean | null;
  has_report: boolean | null;
  only_current_version: boolean;
  include_removed: boolean;
  page: number;
  page_size: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
};

export type CrmReportDto = {
  report_id: number | null;
  report_ids: number[];
  task_assignment_id: number;
  task_id: number;
  task_title: string;
  task_scope: ReportTaskScope;
  task_type: ReportTaskType;
  report_type: ReportType | null;
  required_report_format: ReportType;
  report_status: ReportStatus | null;
  assignment_status: AssignmentStatus;
  version_number: number | null;
  submitted_at: string | null;
  deadline_at: string | null;
  is_overdue: boolean;
  revision_used: number;
  revision_limit: number;
  executor: {
    user_id: number;
    full_name: string;
    role_name: string;
    status: string;
  } | null;
  region: {
    region_id: number;
    name: string;
  } | null;
  org_unit: {
    org_unit_id: number;
    name: string;
  } | null;
  link_validation: unknown;
  last_moderation: unknown;
  available_actions: string[];
};

export type ReportsSummary = {
  total_reports: number;
  under_review_count: number;
  accepted_count: number;
  revision_requested_count: number;
  not_completed_count: number;
  overdue_count: number;
};

export type ReportsSearchResult = {
  items: CrmReport[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  summary: ReportsSummary | null;
};

export type CrmReport = {
  id: number | string;
  reportId: number | null;
  reportIds: number[];
  assignmentId: number;
  taskId: number;
  taskTitle: string;
  taskScope: ReportTaskScope;
  taskType: ReportTaskType;
  reportType: ReportType | null;
  requiredReportFormat: ReportType;
  reportStatus: ReportStatus | null;
  assignmentStatus: AssignmentStatus;
  versionNumber: number | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  isOverdue: boolean;
  revisionUsed: number;
  revisionLimit: number;
  executorId?: number;
  executorName: string;
  executorRole: string;
  executorStatus: string;
  regionId?: number;
  regionName: string;
  orgUnitId?: number;
  orgUnitName: string;
  availableActions: string[];
  raw: CrmReportDto;
};
