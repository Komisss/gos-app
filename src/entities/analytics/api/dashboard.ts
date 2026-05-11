import type {
  AnalyticsDashboardPayload,
  AnalyticsDashboardResponse,
} from '@/entities/analytics/model/types';
import { http } from '@/shared/api/http';

const ANALYTICS_DASHBOARD_ENDPOINT = '/api/v1/crm/analytics/dashboard';

export async function getAnalyticsDashboard(payload: AnalyticsDashboardPayload) {
  return http<AnalyticsDashboardResponse>(ANALYTICS_DASHBOARD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
