export type ReportTaskType = 'online_action' | 'street_action';
export type ReportTaskScope = 'federal' | 'regional';
export type ReportType = 'link' | 'image';
export type ReportStatus = 'pending' | 'under_review' | 'accepted' | 'revision_requested' | 'not_completed';
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
  overdue?: boolean;
  has_report: boolean | null;
  only_current_version: boolean;
  include_removed: boolean;
  page: number;
  page_size: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
};

export type ReportsExportPayload = {
  exportType: 'reports_registry';
  format: 'xlsx';
  filters: {
    region_ids: number[];
    report_statuses: Array<'accepted' | 'revision_requested' | 'under_review'>;
    only_current_version: boolean;
    include_removed: boolean;
  };
  columns: string[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  includeTechnicalFields: boolean;
  includeHistory: boolean;
  asyncMode: true;
};

export type ReportsExportResponse = {
  exportId: string;
  status: 'created' | 'processing' | 'ready' | 'failed';
  message: string;
  fileName: string;
  downloadUrl: string;
  createdAt: string;
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
  link_preview: {
    link_url: string | null;
    url: string | null;
    image_url: string | null;
    file_url: string | null;
    domain: string | null;
    display_url: string | null;
    title: string | null;
    description: string | null;
    preview_status: string | null;
    is_allowed_domain: boolean | null;
    is_reachable: boolean | null;
    http_status: number | null;
    checked_at: string | null;
    system_comment: string | null;
  } | null;
  report_content?: {
    link_url: string | null;
    file_id: number | null;
    preview_url: string | null;
    display_value: string | null;
  } | null;
  last_moderation: ReportLastModeration | null;
  available_actions: string[];
};

export type ReportLastModeration = {
  moderation_action_id: number;
  action_type: string;
  moderation_level: string;
  reason_id: number | null;
  comment: string | null;
  created_at: string;
};

export type ReportDetailsDto = CrmReportDto & {
  is_current_version: boolean;
  report_content: {
    link_url: string | null;
    file_id: number | null;
    preview_url: string | null;
    display_value: string | null;
  } | null;
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
  linkPreview: {
    linkUrl: string | null;
    url: string | null;
    imageUrl: string | null;
    fileUrl: string | null;
    displayUrl: string | null;
    title: string | null;
    description: string | null;
  } | null;
  availableActions: string[];
  raw: CrmReportDto;
};

export type ReportDetails = CrmReport & {
  isCurrentVersion: boolean;
  reportContent: {
    linkUrl: string | null;
    fileId: number | null;
    previewUrl: string | null;
    displayValue: string | null;
  } | null;
  linkValidation: unknown;
  lastModeration: ReportLastModeration | null;
};

export type ReportVersionsFilters = {
  include_content: boolean;
  include_link_validation: boolean;
  include_moderation: boolean;
  sort_direction: 'asc' | 'desc';
};

export type ReportVersionItem = {
  report_id: number;
  version_number: number;
  is_current_version: boolean;
  report_type: ReportType;
  report_status: ReportStatus;
  submitted_by_user_id: number;
  submitted_at: string;
  available_actions: string[];
  content: ReportDetailsDto['report_content'];
  link_validation: {
    link_validation_result_id: number;
    is_allowed_domain: boolean;
    is_reachable: boolean;
    http_status: number;
    checked_at: string;
    system_comment: string;
  } | null;
  last_moderation: unknown;
};

export type ReportVersionsResponse = {
  task_assignment_id: number;
  task_id: number;
  task_title: string;
  assignment_status: AssignmentStatus;
  revision_used: number;
  revision_limit: number;
  current_report_id: number;
  total_versions: number;
  versions: ReportVersionItem[];
};

export type ModerationActionsFilters = {
  action_types: string[];
  include_moderator: boolean;
  include_versions: boolean;
  moderation_level: string;
  page: number;
  page_size: number;
  sort_direction: 'asc' | 'desc';
};

export type ModerationActionItem = {
  moderation_action_id: number;
  report_id: number;
  task_assignment_id: number;
  action_type: string;
  moderation_level: string;
  moderator_user_id: number;
  moderator_full_name: string;
  moderator_role: string;
  reason_id: number | null;
  reason_name: string | null;
  comment: string | null;
  is_override: boolean;
  bulk_operation_id: string | null;
  created_at: string;
};

export type PaginatedResponse<T> = {
  report_id: number;
  task_assignment_id: number;
  task_id: number;
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export type LinkValidationResponse = {
  report_id: number;
  report_type: ReportType;
  link_url: string | null;
  link_validation_result: {
    link_validation_result_id: number;
    url: string;
    domain: string;
    is_allowed_domain: boolean;
    is_reachable: boolean;
    http_status: number;
    checked_at: string;
    system_comment: string;
    validation_status: string;
  } | null;
};

export type AuditLogFilters = {
  action_types: string[];
  actor_user_ids: number[];
  entity_types: string[];
  from: string;
  to: string;
  include_payload: boolean;
  page: number;
  page_size: number;
  sort_direction: 'asc' | 'desc';
  sources: string;
};

export type AuditLogItem = {
  audit_log_id: number;
  actor_user_id: number;
  actor_full_name: string;
  actor_role: string;
  region_id: number | null;
  entity_type: string;
  entity_id: number;
  action_type: string;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
  source: string;
  correlation_id: string;
  created_at: string;
};

export type ReportHistoryFilters = {
  event_types: string;
  from: string;
  to: string;
  include_audit: boolean;
  include_link_validation: boolean;
  include_versions: boolean;
  page: number;
  page_size: number;
};

export type ReportHistoryItem = {
  event_id: string;
  event_type: string;
  event_title: string;
  event_description: string;
  event_at: string;
  actor: {
    user_id: number;
    full_name: string;
    role: string;
    is_system: boolean;
  } | null;
  report_id: number;
  version_number: number | null;
  source_entity_type: string;
  source_entity_id: string;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
};

export type ReportHistoryResponse = PaginatedResponse<ReportHistoryItem> & {
  current_report_status: string;
  current_assignment_status: string;
};

export type ReportReturnReason = {
  id: number;
  code: string;
  name: string;
};

export type AcceptReportPayload = {
  comment: string;
};

export type FederalAcceptReportPayload = AcceptReportPayload & {
  notify_executor: boolean;
};

export type RequestReportRevisionPayload = {
  reason_id: number;
  comment: string;
};

export type FederalRequestReportRevisionPayload = RequestReportRevisionPayload & {
  notify_executor: boolean;
  ignore_revision_limit: boolean;
};

export type BulkAcceptReportsPayload = {
  report_ids: number[];
  comment: string;
  expected_status: string | null;
  skip_invalid: boolean;
};

export type BulkRequestReportRevisionPayload = {
  report_ids: number[];
  reason_id: number;
  comment: string;
  expected_status: string | null;
  skip_invalid: boolean;
};
