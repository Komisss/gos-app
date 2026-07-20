import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';

import { getRegionDashboard } from '@/entities/analytics/api/dashboard';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';

export default function RegionDashboardPage() {
  const { regionId } = useParams();
  const parsedRegionId = Number(regionId);
  const isValidRegionId = Number.isInteger(parsedRegionId) && parsedRegionId > 0;
  const [filters, setFilters] = useState(() => createInitialRegionDashboardFilters());
  const [appliedFilters, setAppliedFilters] = useState(() => createInitialRegionDashboardFilters());

  const regionDashboardQuery = useQuery({
    queryKey: ['analytics-dashboard', 'region', parsedRegionId, appliedFilters],
    queryFn: () => getRegionDashboard(parsedRegionId, appliedFilters),
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
          <h1 className="text-3xl font-semibold !text-slate-900">
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

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <DateFilter
              label="Дата с"
              value={filters.date_from}
              onChange={(date_from) => setFilters((current) => ({ ...current, date_from }))}
            />
            <DateFilter
              label="Дата по"
              value={filters.date_to}
              onChange={(date_to) => setFilters((current) => ({ ...current, date_to }))}
            />
          </div>
          <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
            <Button
              type="button"
              className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
              disabled={regionDashboardQuery.isFetching}
              onClick={() => setAppliedFilters(filters)}
            >
              {regionDashboardQuery.isFetching ? 'Загрузка...' : 'Получить дашборд'}
            </Button>
          </div>
        </section>

        <TasksBarChart
          title="Онлайн задачи"
          metricLabel="Процент выполнения"
          yAxisLabel="% выполнения"
          valueFormatter={formatPercent}
          isCompleteValue={(value) => value >= 100}
          tasks={(regionDashboard?.online.tasks ?? []).map((task) => ({
            taskId: task.task_id,
            title: task.task_title,
            value: task.accepted_reports_percent,
            createdAt: task.created_at,
            activatedAt: task.activated_at,
            deadlineAt: task.deadline_at,
          }))}
        />

        <TasksBarChart
          title="Уличные задачи"
          metricLabel="Количество человек"
          yAxisLabel="Кол-во чел."
          valueFormatter={formatNumber}
          isCompleteValue={(_, task) => task.acceptedReportsPercent >= 100}
          tasks={(regionDashboard?.street.tasks ?? []).map((task) => ({
            taskId: task.task_id,
            title: task.task_title,
            value: task.people_count,
            createdAt: task.created_at,
            activatedAt: task.activated_at,
            deadlineAt: task.deadline_at,
            acceptedReportsPercent: task.accepted_reports_percent,
          }))}
        />

        {regionDashboardQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Не удалось загрузить дашборд региона.
          </div>
        )}
      </div>
    </div>
  );
}

function createInitialRegionDashboardFilters() {
  const now = new Date();
  const dateFrom = new Date(now);
  dateFrom.setMonth(dateFrom.getMonth() - 3);

  return {
    date_from: dateFrom.toISOString(),
    date_to: now.toISOString(),
  };
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
    </div>
  );
}

function TasksBarChart({
  title,
  metricLabel,
  yAxisLabel,
  valueFormatter,
  isCompleteValue,
  tasks,
}: {
  title: string;
  metricLabel: string;
  yAxisLabel: string;
  valueFormatter: (value?: number | null) => string;
  isCompleteValue?: (value: number, task: {
    acceptedReportsPercent?: number;
  }) => boolean;
  tasks: Array<{
    taskId: number;
    title: string;
    value: number;
    createdAt: string | null;
    activatedAt: string | null;
    deadlineAt: string | null;
    acceptedReportsPercent?: number;
  }>;
}) {
  const navigate = useNavigate();
  const chartData = tasks.map((task) => ({
    id: String(task.taskId),
    taskId: task.taskId,
    title: task.title,
    value: task.value,
    createdAt: task.createdAt,
    activatedAt: task.activatedAt,
    deadlineAt: task.deadlineAt,
    acceptedReportsPercent: task.acceptedReportsPercent,
    isOverdue: isPastDate(task.deadlineAt),
    isComplete: isCompleteValue?.(task.value, task) ?? false,
  }));
  const chartWidth = Math.max(900, chartData.length * 150);

  function openTask(taskId: number) {
    navigate(`/tasks/${taskId}`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold !text-slate-900">{title}</h2>
      </div>

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
            tickFormatter={(value) => valueFormatter(Number(value))}
            width={72}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              fill: '#475569',
              fontSize: 13,
            }}
          />
          <Tooltip
            content={
              <TaskChartTooltip metricLabel={metricLabel} valueFormatter={valueFormatter} />
            }
          />
          <Bar
            dataKey="value"
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
          >
            {chartData.map((task) => (
              <Cell key={task.id} fill={getTaskBarFill(task.isOverdue, task.isComplete)} />
            ))}
          </Bar>
        </BarChart>
      </div>
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

function TaskChartTooltip({
  active,
  payload,
  metricLabel,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      title?: string;
      value?: number;
      createdAt?: string | null;
      activatedAt?: string | null;
      deadlineAt?: string | null;
    };
  }>;
  metricLabel: string;
  valueFormatter: (value?: number | null) => string;
}) {
  const task = payload?.[0]?.payload;

  if (!active || !task) {
    return null;
  }

  return (
    <div className="max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <div className="font-semibold text-slate-900">{task.title}</div>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        <div>
          {metricLabel}: <span className="font-medium text-slate-900">{valueFormatter(task.value)}</span>
        </div>
        <div>Создана: {formatDateTime(task.createdAt)}</div>
        <div>Активация: {formatDateTime(task.activatedAt)}</div>
        <div>Дедлайн: {formatDateTime(task.deadlineAt)}</div>
      </div>
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Не указано';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function isPastDate(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime()) && date.getTime() < Date.now();
}

function getTaskBarFill(isOverdue: boolean, isComplete: boolean) {
  if (isComplete) {
    return '#16a34a';
  }

  return isOverdue ? '#dc2626' : '#465cd3';
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
