import type {
  AnalyticsExportPayload,
  AnalyticsDashboardExportPayload,
  ExportCreateResponse,
  ReportsByOrgUnitsExportPayload,
  ReportsByTasksExportPayload,
  ReportsByUsersExportPayload,
  ReportsDeadlinesExportPayload,
  ReportsLinkValidationExportPayload,
  ReportsModerationExportPayload,
  ReportsNotCompletedExportPayload,
  ReportsReturnedForRevisionExportPayload,
  ReportsByRegionsExportPayload,
  ExportStatusResponse,
} from '@/entities/export/model/types';
import { http } from '@/shared/api/http';

const EXPORT_ENDPOINT = '/api/v1/crm/analytics/export';
const EXPORTS_ENDPOINT = '/api/v1/crm/exports';

export async function createAnalyticsDashboardExport(payload: AnalyticsDashboardExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsByOrgUnitsExport(payload: ReportsByOrgUnitsExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsByRegionsExport(payload: ReportsByRegionsExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsByTasksExport(payload: ReportsByTasksExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsByUsersExport(payload: ReportsByUsersExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsDeadlinesExport(payload: ReportsDeadlinesExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsLinkValidationExport(payload: ReportsLinkValidationExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsModerationExport(payload: ReportsModerationExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsNotCompletedExport(payload: ReportsNotCompletedExportPayload) {
  return createAnalyticsExport(payload);
}

export async function createReportsReturnedForRevisionExport(
  payload: ReportsReturnedForRevisionExportPayload,
) {
  return createAnalyticsExport(payload);
}

function createAnalyticsExport(payload: AnalyticsExportPayload) {
  return http<ExportCreateResponse>(EXPORT_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getExportStatus(exportId: string) {
  return http<ExportStatusResponse>(`${EXPORTS_ENDPOINT}/${exportId}`);
}

export async function downloadExportFile(exportId: string) {
  return http<Blob>(`${EXPORTS_ENDPOINT}/${exportId}/download`, {
    responseType: 'blob',
  });
}
