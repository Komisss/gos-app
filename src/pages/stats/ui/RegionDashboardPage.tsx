import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

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
              value={formatPercent(regionDashboard?.summary.online_completed_tasks_percent)}
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

        <StreetTasksLineChart tasks={regionDashboard?.street.tasks ?? []} />

        {regionDashboardQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Не удалось загрузить дашборд региона.
          </div>
        )}
      </div>
    </div>
  );
}

function StreetTasksLineChart({
  tasks,
}: {
  tasks: Array<{
    task_id: number;
    task_title: string;
    people_count: number;
  }>;
}) {
  const navigate = useNavigate();
  const chartData = tasks.map((task) => ({
    id: String(task.task_id),
    taskId: task.task_id,
    title: task.task_title,
    peopleCount: task.people_count,
  }));
  const chartWidth = Math.max(900, chartData.length * 150);

  function openTask(taskId: number) {
    navigate(`/tasks/${taskId}`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold !text-slate-900">Уличные задачи</h2>
      </div>

      {chartData.length === 0 ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Нет данных по уличным задачам.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto pb-2">
          <BarChart
            width={chartWidth}
            height={320}
            data={chartData}
            margin={{ top: 16, right: 24, bottom: 40, left: 0 }}
            className="cursor-pointer outline-none focus:outline-none"
            onClick={(data) => {
              const taskId = Number(data?.activePayload?.[0]?.payload?.taskId);

              if (Number.isFinite(taskId)) {
                openTask(taskId);
              }
            }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="id"
              tick={<TaskTitleTick tasks={chartData} onTaskClick={openTask} />}
              interval={0}
              height={72}
              label={{
                value: 'Задачи',
                position: 'insideBottom',
                offset: -8,
                fill: '#475569',
                fontSize: 13,
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(Number(value))}
              width={72}
              label={{
                value: 'Кол-во чел.',
                angle: -90,
                position: 'insideLeft',
                fill: '#475569',
                fontSize: 13,
              }}
            />
            <Tooltip
              formatter={(value) => [formatNumber(Number(value)), 'Количество человек']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
            />
            <Bar
              dataKey="peopleCount"
              fill="#465cd3"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              className="cursor-pointer outline-none focus:outline-none"
              background={(props) => <ClickableBarBackground {...props} onTaskClick={openTask} />}
              onClick={(data) => {
                const taskId = Number(data?.payload?.taskId);

                if (Number.isFinite(taskId)) {
                  openTask(taskId);
                }
              }}
            />
          </BarChart>
        </div>
      )}
    </section>
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

function ClickableBarBackground({
  x,
  y,
  width,
  height,
  payload,
  onTaskClick,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    taskId?: number;
  };
  onTaskClick: (taskId: number) => void;
}) {
  const clickWidth = 130;
  const rectWidth = Number(width ?? 0);
  const rectX = Number(x ?? 0) + rectWidth / 2 - clickWidth / 2;
  const taskId = Number(payload?.taskId);

  return (
    <rect
      x={rectX}
      y={Number(y ?? 0)}
      width={clickWidth}
      height={Number(height ?? 0)}
      fill="#465cd3"
      opacity={0.001}
      className="cursor-pointer outline-none focus:outline-none"
      tabIndex={-1}
      style={{ outline: 'none' }}
      onClick={() => {
        if (Number.isFinite(taskId)) {
          onTaskClick(taskId);
        }
      }}
    />
  );
}

function TaskTitleTick({
  x = 0,
  y = 0,
  payload,
  tasks,
  onTaskClick,
}: {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
  tasks: Array<{
    id: string;
    taskId: number;
    title: string;
  }>;
  onTaskClick: (taskId: number) => void;
}) {
  const task = tasks.find((item) => item.id === payload?.value);
  const title = task?.title ?? '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        transform="rotate(-25)"
        fill="#64748b"
        fontSize={12}
        className="cursor-pointer hover:fill-[#465cd3]"
        onClick={() => {
          if (task) {
            onTaskClick(task.taskId);
          }
        }}
      >
        <title>{title}</title>
        {truncateChartLabel(title)}
      </text>
    </g>
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

function truncateChartLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
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
