import type {
  AnalyticsDashboardPayload,
  AnalyticsDashboardResponse,
  RegionDashboardResponse,
  ReportsByOrgUnitsPayload,
  ReportsByOrgUnitsResponse,
  ReportsByRegionsPayload,
  ReportsByRegionsResponse,
  ReportsByTasksPayload,
  ReportsByTasksResponse,
  ReportsByUserPayload,
  ReportsByUserResponse,
  ReportsByUsersPayload,
  ReportsByUsersResponse,
  ReportsByDeadlinesPayload,
  ReportsByDeadlinesResponse,
  ReportsLinkValidationPayload,
  ReportsLinkValidationResponse,
  ReportsModerationPayload,
  ReportsModerationResponse,
  ReportsNotCompletedPayload,
  ReportsNotCompletedResponse,
  ReportsReturnedForRevisionPayload,
  ReportsReturnedForRevisionResponse,
} from '@/entities/analytics/model/types';
import { http } from '@/shared/api/http';

const ANALYTICS_DASHBOARD_ENDPOINT = '/api/v1/crm/analytics/dashboard';
const REGION_DASHBOARD_ENDPOINT = '/api/v1/crm/analytics/dashboard/region';
const REPORTS_BY_ORG_UNITS_ENDPOINT = '/api/v1/crm/analytics/reports/by-org-units';
const REPORTS_BY_REGIONS_ENDPOINT = '/api/v1/crm/analytics/reports/by-regions';
const REPORTS_BY_TASKS_ENDPOINT = '/api/v1/crm/analytics/reports/by-tasks';
const REPORTS_BY_USER_ENDPOINT = '/api/v1/crm/analytics/reports/by-user';
const REPORTS_BY_USERS_ENDPOINT = '/api/v1/crm/analytics/reports/by-users';
const REPORTS_DEADLINES_ENDPOINT = '/api/v1/crm/analytics/reports/deadlines';
const REPORTS_LINK_VALIDATION_ENDPOINT = '/api/v1/crm/analytics/reports/link-validation';
const REPORTS_MODERATION_ENDPOINT = '/api/v1/crm/analytics/reports/moderation';
const REPORTS_NOT_COMPLETED_ENDPOINT = '/api/v1/crm/analytics/reports/overdue-and-not-completed';
const REPORTS_RETURNED_FOR_REVISION_ENDPOINT = '/api/v1/crm/analytics/reports/returned-for-revision';

export async function getAnalyticsDashboard(payload: AnalyticsDashboardPayload) {
  return http<AnalyticsDashboardResponse>(ANALYTICS_DASHBOARD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRegionDashboard(
  regionId: number,
  filters: { date_from?: string; date_to?: string } = {},
) {
  const params = new URLSearchParams();

  if (filters.date_from) {
    params.set('date_from', filters.date_from);
  }

  if (filters.date_to) {
    params.set('date_to', filters.date_to);
  }

  const queryString = params.toString();

  return http<RegionDashboardResponse>(
    `${REGION_DASHBOARD_ENDPOINT}/${regionId}${queryString ? `?${queryString}` : ''}`,
  );
}

export async function getReportsByOrgUnits(payload: ReportsByOrgUnitsPayload) {
  return http<ReportsByOrgUnitsResponse>(REPORTS_BY_ORG_UNITS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsByRegions(payload: ReportsByRegionsPayload) {
  return http<ReportsByRegionsResponse>(REPORTS_BY_REGIONS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsByTasks(payload: ReportsByTasksPayload) {
  return http<ReportsByTasksResponse>(REPORTS_BY_TASKS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsByUser(payload: ReportsByUserPayload) {
  return http<ReportsByUserResponse>(REPORTS_BY_USER_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsByUsers(payload: ReportsByUsersPayload) {
  return http<ReportsByUsersResponse>(REPORTS_BY_USERS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsDeadlines(payload: ReportsByDeadlinesPayload) {
  return http<ReportsByDeadlinesResponse>(REPORTS_DEADLINES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsLinkValidation(payload: ReportsLinkValidationPayload) {
  return http<ReportsLinkValidationResponse>(REPORTS_LINK_VALIDATION_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsModeration(payload: ReportsModerationPayload) {
  return http<ReportsModerationResponse>(REPORTS_MODERATION_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsNotCompleted(payload: ReportsNotCompletedPayload) {
  return http<ReportsNotCompletedResponse>(REPORTS_NOT_COMPLETED_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportsReturnedForRevision(payload: ReportsReturnedForRevisionPayload) {
  return http<ReportsReturnedForRevisionResponse>(REPORTS_RETURNED_FOR_REVISION_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
