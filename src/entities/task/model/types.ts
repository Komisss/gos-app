export type TaskStatus = "active" | "pending" | "completed";

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
  title: string;
  subtitle?: string;
  department?: string;
  type: string;
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
