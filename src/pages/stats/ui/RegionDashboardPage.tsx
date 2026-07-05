import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getRegionDashboard } from '@/entities/analytics/api/dashboard';

export default function RegionDashboardPage() {
  const { regionId } = useParams();
  const parsedRegionId = Number(regionId);
  const isValidRegionId = Number.isInteger(parsedRegionId) && parsedRegionId > 0;

  const regionDashboardQuery = useQuery({
    queryKey: ['analytics-dashboard', 'region', parsedRegionId],
    queryFn: () => getRegionDashboard(parsedRegionId),
    enabled: isValidRegionId,
  });

  if (!isValidRegionId) {
    return <RegionDashboardMessage text="Некорректный id региона." tone="error" />;
  }

  const regionDashboard = regionDashboardQuery.data;
  const region = regionDashboard?.region;
  const regionalManager = regionDashboard?.regional_manager;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Дашборд региона</p>
          <h1 className="mt-1 text-3xl font-semibold !text-slate-900">
            {region?.name ??
              (regionDashboardQuery.isLoading ? 'Загружаем регион...' : `Регион #${parsedRegionId}`)}
          </h1>
          <p className="mt-4 text-sm text-slate-700">
            Региональный руководитель -{' '}
            {regionDashboardQuery.isLoading ? (
              <span className="text-slate-500">загружаем...</span>
            ) : regionalManager ? (
              <Link
                className="font-medium text-[#465cd3] hover:text-[#3c50bd] hover:underline"
                to={`/users/${regionalManager.id}`}
              >
                {regionalManager.full_name}
              </Link>
            ) : (
              <span className="text-slate-500">не найден</span>
            )}
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <RegionMetricCard title="КПЭ региона">
            <MetricRow label="КПЭ" value={formatNumber(regionDashboard?.kpe.region_kpe)} />
            <MetricRow label="Факт" value={formatNumber(regionDashboard?.kpe.region_fact)} />
            <MetricRow
              label="Процент факта"
              value={formatPercent(regionDashboard?.kpe.region_fact_percent)}
            />
          </RegionMetricCard>

          <RegionMetricCard title="Онлайн задачи">
            <MetricRow
              label="За всё время"
              value={formatNumber(regionDashboard?.summary.online_tasks_count)}
            />
            <MetricRow
              label="Общий процент выполнения"
              value={formatPercent(regionDashboard?.summary.completed_tasks_percent)}
            />
          </RegionMetricCard>

          <RegionMetricCard title="Уличные задачи">
            <MetricRow
              label="За всё время"
              value={formatNumber(regionDashboard?.summary.street_tasks_count)}
            />
            <MetricRow
              label="Общее количество человек"
              value={formatNumber(regionDashboard?.summary.street_people_count)}
            />
          </RegionMetricCard>
        </section>

        {regionDashboardQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Не удалось загрузить дашборд региона.
          </div>
        )}
      </div>
    </div>
  );
}

function RegionMetricCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h2 className="text-base font-semibold !text-slate-900">{title}</h2>}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-base font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function formatNumber(value?: number | null) {
  return value === undefined || value === null ? '—' : new Intl.NumberFormat('ru-RU').format(value);
}

function formatPercent(value?: number | null) {
  return value === undefined || value === null
    ? '—'
    : `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)}%`;
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
