import type {
  AnalyticsDashboardPayload,
  ReportAnalyticsAssignmentStatus,
  DashboardPeriodType,
  ReportsByOrgUnitsPayload,
  ReportsByDeadlinesPayload,
  ReportsByRegionsPayload,
  ReportsByTasksPayload,
  ReportsByUsersPayload,
  ReportsLinkValidationPayload,
  ReportsModerationPayload,
  ReportsNotCompletedPayload,
  ReportsReturnedForRevisionPayload,
} from '@/entities/analytics/model/types';

export type ExportStatus = 'created' | 'processing' | 'ready' | 'failed';

export type AnalyticsDashboardExportPayload = {
  exportType: 'analytics_dashboard';
  format: 'xlsx';
  filters: AnalyticsDashboardPayload;
  columns: [];
  asyncMode: true;
};

export type ReportsByOrgUnitsExportFilters = Omit<
  ReportsByOrgUnitsPayload,
  'page' | 'page_size' | 'org_unit_depth'
> & {
  org_unit_depth: number | null;
};

export type ReportsByOrgUnitsExportPayload = {
  exportType: 'analytics_by_org_units';
  format: 'xlsx';
  filters: ReportsByOrgUnitsExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsByRegionsExportFilters = Omit<
  ReportsByRegionsPayload,
  'page' | 'page_size' | 'assignment_statuses'
>;

export type ReportsByRegionsExportPayload = {
  exportType: 'analytics_by_regions';
  format: 'xlsx';
  filters: ReportsByRegionsExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsByTasksExportFilters = Omit<ReportsByTasksPayload, 'page' | 'page_size'>;

export type ReportsByTasksExportPayload = {
  exportType: 'analytics_by_tasks';
  format: 'xlsx';
  filters: ReportsByTasksExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsByUsersExportFilters = Omit<ReportsByUsersPayload, 'page' | 'page_size'> & {
  assignment_statuses: ReportAnalyticsAssignmentStatus[];
};

export type ReportsByUsersExportPayload = {
  exportType: 'analytics_by_users';
  format: 'xlsx';
  filters: ReportsByUsersExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsDeadlinesExportFilters = Omit<ReportsByDeadlinesPayload, 'page' | 'page_size'>;

export type ReportsDeadlinesExportPayload = {
  exportType: 'analytics_deadlines';
  format: 'xlsx';
  filters: ReportsDeadlinesExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsLinkValidationExportFilters = Omit<
  ReportsLinkValidationPayload,
  | 'page'
  | 'page_size'
  | 'role_ids'
  | 'include_inactive_users'
  | 'include_archived_tasks'
  | 'include_removed_assignments'
> & {
  period_type: DashboardPeriodType | 'link_checked';
};

export type ReportsLinkValidationExportPayload = {
  exportType: 'analytics_link_validation';
  format: 'xlsx';
  filters: ReportsLinkValidationExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsModerationExportFilters = ReportsModerationPayload;

export type ReportsModerationExportPayload = {
  exportType: 'analytics_moderation';
  format: 'xlsx';
  filters: ReportsModerationExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsNotCompletedExportFilters = Omit<
  ReportsNotCompletedPayload,
  'page' | 'page_size' | 'assignment_statuses'
> & {
  assignment_statuses: Array<ReportAnalyticsAssignmentStatus | 'deactivated_not_completed'>;
};

export type ReportsNotCompletedExportPayload = {
  exportType: 'analytics_overdue_not_completed';
  format: 'xlsx';
  filters: ReportsNotCompletedExportFilters;
  columns: string[];
  asyncMode: true;
};

export type ReportsReturnedForRevisionExportFilters = Omit<
  ReportsReturnedForRevisionPayload,
  'page' | 'page_size'
>;

export type ReportsReturnedForRevisionExportPayload = {
  exportType: 'analytics_returned_for_revision';
  format: 'xlsx';
  filters: ReportsReturnedForRevisionExportFilters;
  columns: string[];
  asyncMode: true;
};

export type AnalyticsExportPayload =
  | AnalyticsDashboardExportPayload
  | ReportsByOrgUnitsExportPayload
  | ReportsByRegionsExportPayload
  | ReportsByTasksExportPayload
  | ReportsByUsersExportPayload
  | ReportsDeadlinesExportPayload
  | ReportsLinkValidationExportPayload
  | ReportsModerationExportPayload
  | ReportsNotCompletedExportPayload
  | ReportsReturnedForRevisionExportPayload;

export type ExportCreateResponse = {
  exportId: string;
  status: ExportStatus;
  message: string;
  fileName: string;
  downloadUrl: string;
  createdAt: string;
};

export type ExportStatusResponse = {
  exportId: string;
  status: ExportStatus;
  progressPercent: number;
  fileName: string;
  downloadUrl: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
};
