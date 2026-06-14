export type TaskStatus = "draft" | "scheduled" | "active" | "pending" | "completed" | "archived" | string;

export type TaskScope = "federal" | "regional" | "municipal" | string;

export type TaskType = "online_action" | "street_action";

export type OnlineTaskSubtype = "like" | "comment" | "repost" | "post" | "other"

export type TaskReportFormat = "link" | "image";

export type TaskTargetType = 'region' | 'org_unit' | 'user';

export type TaskTargetPayload = {
  target_type: TaskTargetType;
  target_id: number[];
};

export type TaskTargetDto = {
  id?: number;
  target_type: TaskTargetType;
  target_id: number;
};

export type TaskAssignmentDto = {
  task_assignment_id: number;
  user_id: number;
  user_full_name: string;
  region_id: number | null;
  region_name: string | null;
  org_unit_id: number | null;
  org_unit_name: string | null;
  status: string;
  assigned_at: string;
  deadline_at: string | null;
  is_overdue: boolean;
  revision_limit: number | null;
  revision_used: number;
  completed_at: string | null;
  not_completed_reason: string | null;
};

export type TaskRegionStatisticsDto = {
  region_id: number;
  region_name: string;
  assignments_count: number;
  assignments_with_reports: number;
  assignments_without_reports: number;
  reports_count: number;
  under_review_reports: number;
  accepted_reports: number;
  revision_requested_reports: number;
  rejected_reports: number;
  not_completed_assignments: number;
  overdue_assignments: number;
  completion_rate: number;
  submission_rate: number;
  overdue_rate: number;
};

export type TaskReportDto = {
  report_id: number;
  task_assignment_id: number;
  task_id: number;
  task_title: string;
  version_number: number;
  report_type: TaskReportFormat;
  report_status: string;
  submitted_at: string;
  submitted_by_user_id: number;
  link_url: string | null;
  file_id: number | string | null;
  executor: {
    user_id: number;
    full_name: string;
    username: string;
    status: string;
    role_id: number;
    role_name: string;
    role_code: string;
  } | null;
  region: {
    region_id: number;
    name: string;
  } | null;
  org_unit: {
    org_unit_id: number;
    name: string;
  } | null;
};

export interface TaskDto {
  task_id: number;
  title: string;
  scope: TaskScope;
  short_description?: string;
  full_description?: string;
  status: TaskStatus;
  task_type: TaskType;
  online_task_subtype?: OnlineTaskSubtype | null;
  report_format: TaskReportFormat;
  scheduled_at?: string | null;
  deadline_at: string;
  revision_limit?: number;
  comment_for_executor?: string;
  targets?: TaskTargetDto[];
  is_materialized: boolean;
  assignments_count?: number;
  notifications_count?: number;
  pending_notifications_count?: number;
  sent_notifications_count?: number;
  failed_notifications_count?: number;
  task_assignment_ids?: number[];
  task_assignments?: TaskAssignmentDto[];
  regions_statistics?: TaskRegionStatisticsDto[];
  reports?: TaskReportDto[];
  created_at: string;
  updated_at?: string;
  created_by_user_id: number;
  created_by_role?: string;
}

export type TaskPayload = {
  title: string;
  full_description: string | null;
  scope: TaskScope;
  targets?: TaskTargetPayload[] | null;
  status: TaskStatus;
  task_type: TaskType;
  online_task_subtype?: OnlineTaskSubtype;
  report_format: TaskReportFormat;
  deadline_at: string | null;
  scheduled_at?: string | null;
};

export interface TaskReport {
  id: number;
  author: string;
  authorMeta?: string;
  team: string;
  contentPreview?: string;
  status: string;
  createdAt: string;
  attachmentLabel?: string;
}

export interface Task {
  id: number;
  taskId?: number;
  title: string;
  subtitle?: string;
  department?: string;
  type: TaskType;
  scope?: TaskScope;
  taskType?: TaskType;
  onlineTaskSubtype?: OnlineTaskSubtype | null;
  reportFormat?: TaskReportFormat;
  createdAt?: string;
  updatedAt?: string;
  deadlineAt?: string;
  scheduledAt?: string | null;
  createdByUserId?: number;
  createdByRole?: string;
  shortDescription?: string;
  fullDescription?: string;
  revisionLimit?: number;
  commentForExecutor?: string;
  targets?: TaskTargetDto[];
  isMaterialized: boolean;
  assignmentsCount?: number;
  notificationsCount?: number;
  pendingNotificationsCount?: number;
  sentNotificationsCount?: number;
  failedNotificationsCount?: number;
  taskAssignmentIds?: number[];
  taskAssignments?: TaskAssignmentDto[];
  regionsStatistics?: TaskRegionStatisticsDto[];
  region: string;
  assignee: string;
  assigneeMeta?: string;
  activityStart: string;
  activityEnd: string;
  activityLabel?: string;
  counters?: string[];
  status: TaskStatus;
  statusLabel?: string;
  category?: string;
  author?: string;
  deadlineLabel?: string;
  assignedExecutors?: number;
  reportsCount?: number;
  description?: string;
  questions?: string;
  answerFormat?: string;
  performerSummary?: string;
  aggregatedTasksLabel?: string;
  reports?: TaskReport[];
  taskReports?: TaskReportDto[];
}
