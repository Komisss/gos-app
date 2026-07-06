import { http } from '@/shared/api/http';
import type {
  CrmReport,
  CrmReportDto,
  AuditLogFilters,
  AcceptReportPayload,
  AuditLogItem,
  BulkAcceptReportsPayload,
  BulkRequestReportRevisionPayload,
  FederalAcceptReportPayload,
  FederalRequestReportRevisionPayload,
  LinkValidationResponse,
  ModerationActionItem,
  ModerationActionsFilters,
  PaginatedResponse,
  ReportDetails,
  ReportDetailsDto,
  ReportHistoryFilters,
  ReportHistoryResponse,
  ReportReturnReason,
  ReportSearchPayload,
  ReportsExportPayload,
  ReportsExportResponse,
  ReportVersionsFilters,
  ReportVersionsResponse,
  RequestReportRevisionPayload,
  ReportsSearchResult,
  ReportsSummary,
} from '@/entities/report/model/types';

const REPORTS_SEARCH_ENDPOINT = '/api/v1/crm/reports/search';
const REPORTS_ENDPOINT = '/api/v1/crm/reports';

type ReportsSearchResponse =
  | CrmReportDto[]
  | {
      items?: CrmReportDto[];
      results?: CrmReportDto[];
      data?: CrmReportDto[];
      total?: number;
      page?: number;
      page_size?: number;
      has_more?: boolean;
      summary?: ReportsSummary;
    };

export async function searchReports(payload: ReportSearchPayload): Promise<ReportsSearchResult> {
  const response = await http<ReportsSearchResponse>(REPORTS_SEARCH_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const items = normalizeReportsResponse(response);

  if (Array.isArray(response)) {
    return {
      items: items.map(mapReportDto),
      total: items.length,
      page: payload.page,
      pageSize: payload.page_size,
      hasMore: false,
      summary: null,
    };
  }

  return {
    items: items.map(mapReportDto),
    total: response.total ?? items.length,
    page: response.page ?? payload.page,
    pageSize: response.page_size ?? payload.page_size,
    hasMore: response.has_more ?? false,
    summary: response.summary ?? null,
  };
}

export async function exportReports(payload: ReportsExportPayload) {
  return http<ReportsExportResponse>(`${REPORTS_ENDPOINT}/export`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportSummary(reportId: number): Promise<ReportDetails> {
  const response = await http<ReportDetailsDto>(
    `${REPORTS_ENDPOINT}/${reportId}/summary?include_available_actions=true&include_last_moderation=true&include_link_validation=true`,
  );

  return mapReportDetailsDto(response);
}

export async function acceptReport(reportId: number, payload: AcceptReportPayload) {
  return http<ReportDetailsDto>(`${REPORTS_ENDPOINT}/${reportId}/accept`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function federalAcceptReport(reportId: number, payload: FederalAcceptReportPayload) {
  return http<ReportDetailsDto>(`${REPORTS_ENDPOINT}/${reportId}/federal-accept`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestReportRevision(
  reportId: number,
  payload: RequestReportRevisionPayload,
) {
  return http<ReportDetailsDto>(`${REPORTS_ENDPOINT}/${reportId}/request-revision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function federalRequestReportRevision(
  reportId: number,
  payload: FederalRequestReportRevisionPayload,
) {
  return http<ReportDetailsDto>(`${REPORTS_ENDPOINT}/${reportId}/federal-request-revision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function bulkAcceptReports(payload: BulkAcceptReportsPayload) {
  return http<unknown>(`${REPORTS_ENDPOINT}/bulk-accept`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function bulkRequestReportRevision(payload: BulkRequestReportRevisionPayload) {
  return http<unknown>(`${REPORTS_ENDPOINT}/bulk-request-revision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReportReturnReasons() {
  return http<ReportReturnReason[]>(`${REPORTS_ENDPOINT}/report-return-reasons`);
}

export async function getReportVersions(taskAssignmentId: number, filters: ReportVersionsFilters) {
  return http<ReportVersionsResponse>(
    `/api/v1/crm/task-assignments/${taskAssignmentId}/reports/versions${buildQueryString(filters)}`,
  );
}

export async function getModerationActions(reportId: number, filters: ModerationActionsFilters) {
  return http<PaginatedResponse<ModerationActionItem>>(
    `${REPORTS_ENDPOINT}/${reportId}/moderation-actions${buildQueryString(filters)}`,
  );
}

export async function getReportLinkValidation(reportId: number) {
  return http<LinkValidationResponse>(`${REPORTS_ENDPOINT}/${reportId}/link-validation`);
}

export async function getReportAuditLog(reportId: number, filters: AuditLogFilters) {
  return http<PaginatedResponse<AuditLogItem>>(
    `${REPORTS_ENDPOINT}/${reportId}/audit-log${buildQueryString(filters)}`,
  );
}

export async function getReportHistory(reportId: number, filters: ReportHistoryFilters) {
  return http<ReportHistoryResponse>(
    `${REPORTS_ENDPOINT}/${reportId}/history${buildQueryString(filters)}`,
  );
}

function normalizeReportsResponse(response: ReportsSearchResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  return response.items ?? response.results ?? response.data ?? [];
}

function mapReportDto(report: CrmReportDto): CrmReport {
  return {
    id: report.report_id ?? report.task_assignment_id,
    reportId: report.report_id,
    reportIds: report.report_ids,
    assignmentId: report.task_assignment_id,
    taskId: report.task_id,
    taskTitle: report.task_title,
    taskScope: report.task_scope,
    taskType: report.task_type,
    reportType: report.report_type,
    requiredReportFormat: report.required_report_format,
    reportStatus: report.report_status,
    assignmentStatus: report.assignment_status,
    versionNumber: report.version_number,
    submittedAt: report.submitted_at,
    deadlineAt: report.deadline_at,
    isOverdue: report.is_overdue,
    revisionUsed: report.revision_used,
    revisionLimit: report.revision_limit,
    executorId: report.executor?.user_id,
    executorName: report.executor?.full_name ?? 'Исполнитель не указан',
    executorRole: report.executor?.role_name ?? 'Роль не указана',
    executorStatus: report.executor?.status ?? 'n/a',
    regionId: report.region?.region_id,
    regionName: report.region?.name ?? 'Регион не указан',
    orgUnitId: report.org_unit?.org_unit_id,
    orgUnitName: report.org_unit?.name ?? 'Структура подчинения не указана',
    linkPreview: report.link_preview
      ? {
          linkUrl: report.link_preview.link_url,
          url: report.link_preview.url,
          imageUrl: report.link_preview.image_url,
          fileUrl: report.link_preview.file_url,
          displayUrl: report.link_preview.display_url,
          title: report.link_preview.title,
          description: report.link_preview.description,
        }
      : null,
    availableActions: report.available_actions,
    isCurrentVersion: report.is_current_version,
    raw: report,
  };
}

function mapReportDetailsDto(report: ReportDetailsDto): ReportDetails {
  return {
    ...mapReportDto(report),
    isCurrentVersion: report.is_current_version,
    reportContent: report.report_content
      ? {
          linkUrl: report.report_content.link_url,
          fileId: report.report_content.file_id,
          previewUrl: report.report_content.preview_url,
          displayValue: report.report_content.display_value,
        }
      : null,
    linkValidation: report.link_validation,
    lastModeration: report.last_moderation,
  };
}

function buildQueryString(filters: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();

  return query ? `?${query}` : '';
}
