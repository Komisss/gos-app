export type TaskStatus = "draft" | "scheduled" | "active" | "pending" | "completed" | "archived" | string;

export type TaskScope = "federal" | "regional" | "municipal" | string;

export type TaskType = "online_action" | "street_action";

export type TaskReportFormat = "link" | "image";

export type TaskTargetType = 'region' | 'org_unit' | 'user';

export type TaskTargetPayload = {
  target_type: TaskTargetType;
  target_id: number[];
};

export type TaskTargetDto = {
  target_type: TaskTargetType;
  target_id: number;
};

export interface TaskDto {
  task_id: number;
  title: string;
  scope: TaskScope;
  short_description?: string;
  full_description?: string;
  status: TaskStatus;
  task_type: TaskType;
  report_format: TaskReportFormat;
  scheduled_at?: string | null;
  deadline_at: string;
  revision_limit?: number;
  comment_for_executor?: string;
  targets?: TaskTargetDto[];
  created_at: string;
  updated_at?: string;
  created_by_user_id: number;
}

export type TaskPayload = {
  title: string;
  short_description: string | null;
  full_description: string | null;
  revision_limit: number | null;
  comment_for_executor: string | null;
  scope: TaskScope;
  targets?: TaskTargetPayload[] | null;
  status: TaskStatus;
  task_type: TaskType;
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
  reportFormat?: TaskReportFormat;
  createdAt?: string;
  updatedAt?: string;
  deadlineAt?: string;
  scheduledAt?: string | null;
  createdByUserId?: number;
  shortDescription?: string;
  fullDescription?: string;
  revisionLimit?: number;
  commentForExecutor?: string;
  targets?: TaskTargetDto[];
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
}
