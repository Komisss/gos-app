import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { getAnalyticsDashboard } from '@/entities/analytics/api/dashboard';
import type { AnalyticsDashboardPayload } from '@/entities/analytics/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getUsers } from '@/entities/user/api/users';

export default function RegionDashboardPage() {
  const { regionId } = useParams();
  const parsedRegionId = Number(regionId);
  const isValidRegionId = Number.isInteger(parsedRegionId) && parsedRegionId > 0;

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const dashboardQuery = useQuery({
    queryKey: ['analytics-dashboard', 'region', parsedRegionId],
    queryFn: () => getAnalyticsDashboard(createRegionDashboardFilters(parsedRegionId)),
    enabled: isValidRegionId,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'regional-manager', parsedRegionId],
    queryFn: () => getUsers({ region_ids: String(parsedRegionId), roles: '2' }),
    enabled: isValidRegionId,
  });

  if (!isValidRegionId) {
    return <RegionDashboardMessage text="Некорректный id региона." tone="error" />;
  }

  const region = regionsQuery.data?.find((item) => item.id === parsedRegionId);
  const regionalManager = usersQuery.data?.find(
    (user) => user.role?.code === 'regional_manager' || user.role?.id === 2,
  );

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Дашборд региона</p>
          <h1 className="mt-1 text-3xl font-semibold !text-slate-900">
            {region?.name ??
              (regionsQuery.isLoading ? 'Загружаем регион...' : `Регион #${parsedRegionId}`)}
          </h1>
          <p className="mt-4 text-sm text-slate-700">
            Региональный руководитель -{' '}
            {usersQuery.isLoading ? (
              <span className="text-slate-500">загружаем...</span>
            ) : regionalManager ? (
              <Link
                className="font-medium text-[#465cd3] hover:text-[#3c50bd] hover:underline"
                to={`/users/${regionalManager.id}`}
              >
                {regionalManager.fullName}
              </Link>
            ) : (
              <span className="text-slate-500">не найден</span>
            )}
          </p>
        </section>

        {dashboardQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Не удалось загрузить дашборд региона.
          </div>
        )}
      </div>
    </div>
  );
}

function createRegionDashboardFilters(regionId: number): AnalyticsDashboardPayload {
  const now = new Date();
  const dateFrom = new Date(now);
  dateFrom.setMonth(dateFrom.getMonth() - 3);

  return {
    date_from: dateFrom.toISOString(),
    date_to: now.toISOString(),
    period_type: 'assignment_created',
    region_ids: [regionId],
    task_ids: [],
    org_unit_ids: [],
    user_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    include_archived_tasks: false,
    include_removed_assignments: false,
    only_current_report_version: true,
  };
}

function RegionDashboardMessage({
  text,
  tone = 'default',
}: {
  text: string;
  tone?: 'default' | 'error';
}) {
  return (
    <div className="min-h-full bg-slate-50 px-6 py-6">
      <div
        className={`mx-auto max-w-[900px] rounded-lg border p-8 text-center text-sm ${
          tone === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
