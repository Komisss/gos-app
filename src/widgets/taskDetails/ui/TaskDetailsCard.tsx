import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArchiveRestore,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Pencil,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

import { searchReports } from '@/entities/report/api/reports';
import type { CrmReport, ReportSearchPayload } from '@/entities/report/model/types';
import type { ReportsExportResponse, ReportStatus } from '@/entities/report/model/types';
import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import type { Task } from '@/entities/task/model/types';
import {
  getReportFormatLabel,
  getOnlineTaskSubtypeLabel,
  getScopeLabel,
  getStatusLabel,
  getTaskTypeLabel,
  updateTask,
} from '@/entities/task/api/tasks';
import type { TaskPayload } from '@/entities/task/model/types';
import { getUserById, getUsers } from '@/entities/user/api/users';
import type { UserDetails, UserListItem } from '@/entities/user/model/types';
import { USER_ROLE_IDS, getRoleLabelById } from '@/entities/user/model/roleOptions';
import { useAuth } from '@/features/auth/model/AuthContext';
import { copyToClipboard } from '@/shared/lib/copyToClipboard';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ReportDetailsDialog } from '@/widgets/reportDetails/ui/ReportDetailsDialog';
import { ReportModerationActions } from '@/widgets/reportDetails/ui/ReportModerationActions';
import { ReportExportPopover } from '@/widgets/reportRegistry/ui/ReportExportPopover';
import { AnalyticsExportStatusToast } from '@/widgets/reports/ui/AnalyticsExportStatusToast';
import { TaskEditDialog } from '@/widgets/taskRegistry/ui/TaskEditDialog';
import { getStatusClassName } from '@/widgets/taskRegistry/ui/TaskRegistryTable';

type Props = {
  task: Task;
  isTogglingArchive?: boolean;
  showOpenPageLink?: boolean;
  onToggleArchive?: (task: Task) => void;
  onDeleted?: () => void;
};

type TaskRegionStatistic = NonNullable<Task['regionsStatistics']>[number];

const taskDetailsReportStatusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: 'under_review', label: 'На проверке' },
  { value: 'accepted', label: 'Принят' },
  { value: 'revision_requested', label: 'На доработке' },
  { value: 'rejected', label: 'Отклонен' },
];

export function TaskDetailsCard({
  task,
  isTogglingArchive,
  showOpenPageLink = false,
  onToggleArchive,
}: Props) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [toggleArchiveConfirmOpen, setToggleArchiveConfirmOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [exportJob, setExportJob] = useState<ReportsExportResponse | null>(null);
  const authorQuery = useQuery({
    queryKey: ['user', task.createdByUserId],
    queryFn: () => getUserById(task.createdByUserId ?? 0),
    enabled: Boolean(task.createdByUserId),
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    enabled: Boolean(task.targets?.some((target) => target.target_type === 'user')),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
    enabled: Boolean(task.targets?.some((target) => target.target_type === 'org_unit')),
  });

  const targetItems = buildTargetItems(task, {
    users: usersQuery.data ?? [],
    regions: regionsQuery.data ?? [],
    orgUnits: orgUnitsQuery.data ?? [],
  });
  const isCurrentUserRegionalManager = session?.role?.id === USER_ROLE_IDS.regionalManager;
  const taskAuthorRoleId = authorQuery.data?.role?.id ?? null;
  const isFederalTaskAuthor = taskAuthorRoleId === USER_ROLE_IDS.federalManager;
  const isDifferentTaskAuthor =
    authorQuery.data?.username && session?.username
      ? authorQuery.data.username !== session.username
      : Boolean(
          task.createdByUserId &&
          session?.userId &&
          task.createdByUserId !== session.userId,
        );
  const isDifferentRegionalTaskAuthor =
    taskAuthorRoleId === USER_ROLE_IDS.regionalManager && isDifferentTaskAuthor;
  const isAuthorRoleLoading =
    isCurrentUserRegionalManager &&
    Boolean(task.createdByUserId) &&
    authorQuery.isLoading;
  const areTaskActionsRestricted =
    isCurrentUserRegionalManager &&
    (isFederalTaskAuthor || isDifferentRegionalTaskAuthor || isAuthorRoleLoading);
  const shouldHideAuthorIdentity =
    isCurrentUserRegionalManager && (isFederalTaskAuthor || isAuthorRoleLoading);
  const underReviewReportsCount = getTaskUnderReviewReportsCount(task);
  const reportExportFilters = createTaskDetailsReportExportFilters(task.id);

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: async (_data, variables) => {
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  async function handleCopyTaskLink() {
    const link = `${window.location.origin}/tasks/${task.id}`;

    try {
      setIsCopyingLink(true);
      await copyToClipboard(link);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку', {
        description: 'Скопируйте адрес из открытой страницы задачи.',
      });
    } finally {
      setIsCopyingLink(false);
    }
  }

  return (
    <>
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${getStatusClassName(task.status)}`}>
              {task.statusLabel ?? getStatusLabel(task.status)}
            </Badge>
            <span className="text-xs font-medium text-slate-500">Задача #{task.id}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-tight !text-slate-900">{task.title}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <ReportExportPopover
            reportFilters={reportExportFilters}
            regionOptions={(regionsQuery.data ?? []).map((region) => ({
              value: String(region.id),
              label: region.name,
              description: region.code,
            }))}
            reportStatusOptions={taskDetailsReportStatusOptions}
            initialFiltersFromReportFilters
            variant="task-details"
            onExportStarted={setExportJob}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-slate-200"
            onClick={handleCopyTaskLink}
            disabled={isCopyingLink}
            aria-label="Скопировать ссылку на задачу"
          >
            <Copy />
          </Button>
          {showOpenPageLink && (
            <Button asChild variant="outline" className="border-slate-200">
              <Link to={`/tasks/${task.id}`}>
                <ExternalLink />
                Открыть страницу
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            disabled={areTaskActionsRestricted}
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
            Редактировать
          </Button>
          {onToggleArchive && (
            <Button
              type="button"
              variant={task.status === 'archived' ? 'outline' : 'destructive'}
              disabled={isTogglingArchive || areTaskActionsRestricted}
              onClick={() => setToggleArchiveConfirmOpen(true)}
            >
              {task.status === 'archived' ? <ArchiveRestore /> : <Archive />}
              {task.status === 'archived' ? 'Активировать' : 'Деактивировать'}
            </Button>
          )}
        </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Уровень" value={getScopeLabel(task.scope ?? '')} />
        <InfoItem label="Тип задачи" value={getTaskTypeLabel(task.taskType ?? task.type)} />
        {task.taskType === 'online_action' && (
          <InfoItem label="Подтип задачи" value={getOnlineTaskSubtypeLabel(task.onlineTaskSubtype)} />
        )}
        <InfoItem label="Формат отчета" value={getReportFormatLabel(task.reportFormat ?? '')} />
        <InfoItem
          label="Период выполнения"
          value={<TaskPeriod scheduledAt={task.scheduledAt} deadlineAt={task.deadlineAt} />}
        />
        <InfoItem
          label="Автор"
          value={
            <AuthorLink
              author={authorQuery.data}
              authorId={task.createdByUserId}
              role={task.createdByRole}
              hideIdentity={shouldHideAuthorIdentity}
            />
          }
        />
        <InfoItem label="Назначений" value={formatNumber(task.assignmentsCount)} />
        <InfoItem label="Ожидают проверки" value={formatNumber(underReviewReportsCount)} />
        <InfoItem
          label="Адресаты"
          value={<TargetsPopover targets={targetItems} />}
          className="md:col-span-2 xl:col-span-3"
        />
        </div>

        <div className="mt-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Описание</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {task.fullDescription || task.description || 'Описание задачи пока не заполнено.'}
          </p>
        </section>
        </div>
        <TaskRegionsStatisticsTable
          statistics={task.regionsStatistics ?? []}
          getRegionHref={(region) => `/stats/by_region?task_id=${task.id}&region_id=${region.region_id}`}
        />
      </article>

      <TaskEditDialog
        task={task}
        open={editOpen}
        isSubmitting={updateMutation.isPending}
        onOpenChange={setEditOpen}
        onSubmit={(taskId, payload) => updateMutation.mutate({ taskId, payload })}
      />

      <Dialog open={toggleArchiveConfirmOpen} onOpenChange={setToggleArchiveConfirmOpen}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{task.status === 'archived' ? 'Активировать задачу?' : 'Деактивировать задачу?'}</DialogTitle>
            <DialogDescription>
              {task.status === 'archived'
                ? 'Задача станет активной и снова будет доступна в рабочих списках.'
                : 'Задача будет деактивирована и перестанет отображаться как активная.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setToggleArchiveConfirmOpen(false)}
              disabled={isTogglingArchive}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant={task.status === 'archived' ? 'default' : 'destructive'}
              disabled={isTogglingArchive || areTaskActionsRestricted}
              onClick={() => {
                if (areTaskActionsRestricted) {
                  return;
                }

                onToggleArchive?.(task);
                setToggleArchiveConfirmOpen(false);
              }}
            >
              {isTogglingArchive ? 'Выполняем...' : task.status === 'archived' ? 'Активировать' : 'Деактивировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReportDetailsDialog
        reportId={selectedReportId}
        open={selectedReportId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReportId(null);
          }
        }}
      />
      <AnalyticsExportStatusToast
        exportJob={exportJob}
        title="Экспорт отчетов"
        defaultFileName={`task-${task.id}-reports.xlsx`}
        onClose={() => setExportJob(null)}
      />
    </>
  );
}

function TaskAssignmentsTable({ assignments }: { assignments: NonNullable<Task['taskAssignments']> }) {
  if (assignments.length === 0) {
    return null;
  }

  return (
    <TaskDataSection title="Назначения исполнителей">
      <Table className="min-w-[1200px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>Исполнитель</TableHead>
            <TableHead>Регион</TableHead>
            <TableHead>Структура подчинения</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Назначено</TableHead>
            <TableHead>Дедлайн</TableHead>
            <TableHead>Просрочено</TableHead>
            <TableHead>Завершено</TableHead>
            <TableHead>Причина невыполнения</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.task_assignment_id}>
              <TableCell>#{assignment.task_assignment_id}</TableCell>
              <TableCell>
                <Link
                  to={`/users/${assignment.user_id}`}
                  className="text-[#465cd3] hover:underline"
                >
                  {assignment.user_full_name || `Пользователь #${assignment.user_id}`}
                </Link>
              </TableCell>
              <TableCell>{assignment.region_name ?? 'Не указан'}</TableCell>
              <TableCell>{assignment.org_unit_name ?? 'Не указана'}</TableCell>
              <TableCell>{formatAssignmentStatus(assignment.status)}</TableCell>
              <TableCell>{formatDateTime(assignment.assigned_at)}</TableCell>
              <TableCell>{formatDateTime(assignment.deadline_at)}</TableCell>
              <TableCell>{formatBoolean(assignment.is_overdue)}</TableCell>
              <TableCell>{formatDateTime(assignment.completed_at)}</TableCell>
              <TableCell>{formatNotCompletedReason(assignment.not_completed_reason)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TaskDataSection>
  );
}

function TaskRegionsStatisticsTable({
  statistics,
  getRegionHref,
}: {
  statistics: NonNullable<Task['regionsStatistics']>;
  getRegionHref: (region: TaskRegionStatistic) => string;
}) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <TaskDataSection title="Статистика по регионам">
      <Table className="min-w-[760px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>Регион</TableHead>
            <TableHead>Назначения</TableHead>
            <TableHead>Отчитались</TableHead>
            <TableHead>На проверке</TableHead>
            <TableHead>Принято</TableHead>
            <TableHead>Отклонено</TableHead>
            <TableHead>Выполнение</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statistics.map((item, index) => (
            <TableRow
              key={item.region_id}
              className={index % 2 === 0 ? 'bg-white hover:bg-sky-50' : 'bg-sky-50/40 hover:bg-sky-100/70'}
            >
              <TableCell>
                <Link
                  to={getRegionHref(item)}
                  className="font-medium text-[#465cd3] hover:underline"
                >
                  {item.region_name}
                </Link>
              </TableCell>
              <TableCell>{formatNumber(item.assignments_count)}</TableCell>
              <TableCell>{formatNumber(item.reports_count)}</TableCell>
              <TableCell>{formatNumber(item.under_review_reports)}</TableCell>
              <TableCell>{formatNumber(item.accepted_reports)}</TableCell>
              <TableCell>{formatNumber(item.revision_requested_reports)}</TableCell>
              <TableCell>{formatPercent(item.completion_rate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TaskDataSection>
  );
}

function TaskRegionReportsDialog({
  taskId,
  region,
  onOpenChange,
  onReportClick,
}: {
  taskId: number;
  region: TaskRegionStatistic | null;
  onOpenChange: (open: boolean) => void;
  onReportClick: (reportId: number) => void;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const open = region !== null;
  const regionId = region?.region_id ?? null;

  const reportsQuery = useQuery({
    queryKey: ['crm-reports', 'task-region-review', taskId, regionId, page, pageSize],
    queryFn: () => searchReports(createTaskRegionReportsPayload({ taskId, regionId: regionId ?? 0, page, pageSize })),
    enabled: open && regionId !== null,
  });

  const reports = reportsQuery.data?.items ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const hasMore = reportsQuery.data?.hasMore ?? false;

  async function handleModerationSuccess() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPage(1);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-[min(1200px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Отчеты на проверке</DialogTitle>
          <DialogDescription>
            {region?.region_name ?? 'Регион'}: отчеты по задаче #{taskId}
          </DialogDescription>
        </DialogHeader>

        {reportsQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем отчеты...
          </div>
        ) : reportsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить отчеты.
          </div>
        ) : (
          <div className="flex min-h-0 w-full max-w-full flex-1 flex-col space-y-3 overflow-hidden">
            <div className="min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-auto rounded-md border border-slate-200">
              <Table className="min-w-[1600px] whitespace-nowrap">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-24">Действия</TableHead>
                    <TableHead className="w-28">Отчет</TableHead>
                    <TableHead className="w-28">Назначение</TableHead>
                    <TableHead className="min-w-[300px]">Задача</TableHead>
                    <TableHead className="min-w-[240px]">Исполнитель</TableHead>
                    <TableHead className="min-w-[220px]">Регион</TableHead>
                    <TableHead className="min-w-[220px]">Структура подчинения</TableHead>
                    <TableHead className="w-40">Тип задачи</TableHead>
                    <TableHead className="w-40">Формат отчета</TableHead>
                    <TableHead className="w-40">Статус отчета</TableHead>
                    <TableHead className="w-44">Статус назначения</TableHead>
                    <TableHead className="w-32">Правки</TableHead>
                    <TableHead className="w-44">Отправлен</TableHead>
                    <TableHead className="w-44">Дедлайн</TableHead>
                    <TableHead className="w-32">Просрочен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="py-10 text-center text-sm text-slate-500">
                        Нет отчетов на проверке.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={getReportRowKey(report)} className="hover:bg-slate-50">
                        <TableCell>
                          {report.reportId ? (
                            <ReportModerationActions
                              reportId={report.reportId}
                              iconOnly
                              acceptIcon={<ThumbsUp />}
                              revisionIcon={<ThumbsDown />}
                              acceptButtonLabel="Принять отчет"
                              acceptTitle="Принять отчет"
                              revisionButtonLabel="Вернуть на доработку"
                              revisionTitle="Вернуть на доработку"
                              onSuccess={handleModerationSuccess}
                            />
                          ) : (
                            <span className="text-xs text-slate-500">n/a</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.reportId ? (
                            <button
                              type="button"
                              className="font-medium text-[#465cd3] hover:underline"
                              onClick={() => onReportClick(report.reportId ?? 0)}
                            >
                              #{report.reportId}
                            </button>
                          ) : (
                            'n/a'
                          )}
                        </TableCell>
                        <TableCell>#{report.assignmentId}</TableCell>
                        <TableCell className="min-w-[300px]">
                          <div className="space-y-1 whitespace-normal">
                            <div className="font-medium text-slate-900">{report.taskTitle}</div>
                            <div className="text-xs text-slate-500">
                              ID задачи: {report.taskId} • {getScopeLabel(report.taskScope)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{report.executorName}</div>
                            <div className="text-xs text-slate-500">
                              ID: {report.executorId ?? 'n/a'} • {report.executorRole}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{report.regionName}</TableCell>
                        <TableCell>{report.orgUnitName}</TableCell>
                        <TableCell>{getTaskTypeLabel(report.taskType)}</TableCell>
                        <TableCell>{getReportFormatLabel(report.requiredReportFormat)}</TableCell>
                        <TableCell>{formatReportStatus(report.reportStatus)}</TableCell>
                        <TableCell>{formatAssignmentStatus(report.assignmentStatus)}</TableCell>
                        <TableCell>{report.revisionUsed} / {report.revisionLimit}</TableCell>
                        <TableCell>{formatDateTime(report.submittedAt)}</TableCell>
                        <TableCell>{formatDateTime(report.deadlineAt)}</TableCell>
                        <TableCell>{formatBoolean(report.isOverdue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
              <span className="text-sm text-slate-500">
                Найдено: {total}, страница {page}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Назад
                </Button>
                <Button type="button" variant="outline" disabled={!hasMore} onClick={() => setPage((current) => current + 1)}>
                  Вперед
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskReportsTable({
  reports,
  onReportClick,
}: {
  reports: NonNullable<Task['taskReports']>;
  onReportClick: (reportId: number) => void;
}) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <TaskDataSection title="Отчеты по задаче">
      <Table className="min-w-[1100px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>ID отчета</TableHead>
            <TableHead>ID назначения</TableHead>
            <TableHead>Версия</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Отправлен</TableHead>
            <TableHead>Исполнитель</TableHead>
            <TableHead>Регион</TableHead>
            <TableHead>Структура подчинения</TableHead>
            <TableHead>Ссылка / файл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.report_id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onReportClick(report.report_id)}
            >
              <TableCell>
                <button
                  type="button"
                  className="font-medium text-[#465cd3] hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReportClick(report.report_id);
                  }}
                >
                  #{report.report_id}
                </button>
              </TableCell>
              <TableCell>#{report.task_assignment_id}</TableCell>
              <TableCell>{formatNumber(report.version_number)}</TableCell>
              <TableCell>{getReportFormatLabel(report.report_type)}</TableCell>
              <TableCell>{formatReportStatus(report.report_status)}</TableCell>
              <TableCell>{formatDateTime(report.submitted_at)}</TableCell>
              <TableCell>{report.executor?.full_name ?? `Пользователь #${report.submitted_by_user_id}`}</TableCell>
              <TableCell>{report.region?.name ?? 'Не указан'}</TableCell>
              <TableCell>{report.org_unit?.name ?? 'Не указана'}</TableCell>
              <TableCell>
                {report.link_url ? (
                  <a
                    href={report.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#465cd3] hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Открыть ссылку
                  </a>
                ) : (
                  report.file_id ?? 'Не указан'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TaskDataSection>
  );
}

function TaskDataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function AuthorLink({
  author,
  authorId,
  role,
  hideIdentity = false,
}: {
  author?: UserDetails;
  authorId?: number;
  role?: string | null;
  hideIdentity?: boolean;
}) {
  const authorRole = author?.role
    ? author.role.name || getRoleLabelById(author.role.id) || 'Не указана'
    : role ?? 'Не указана';

  if (hideIdentity) {
    return <>{authorRole}</>;
  }

  if (!authorId) {
    return <>Не указан</>;
  }

  return (
    <div className="space-y-1">
      <Link to={`/users/${authorId}`} className="text-[#465cd3] hover:underline">
        {author ? `${author.fullName} (@${author.username})` : `Пользователь #${authorId}`}
      </Link>
      <div className="text-xs font-normal text-slate-500">{authorRole}</div>
    </div>
  );
}

function createTaskRegionReportsPayload({
  taskId,
  regionId,
  page,
  pageSize,
}: {
  taskId: number;
  regionId: number;
  page: number;
  pageSize: number;
}): ReportSearchPayload {
  const dateRange = createTenYearDateRange();

  return {
    search: '',
    region_ids: [regionId],
    task_ids: [taskId],
    user_ids: [],
    org_unit_ids: [],
    role_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    report_statuses: ['under_review'],
    assignment_statuses: [],
    submitted_from: dateRange.from,
    submitted_to: dateRange.to,
    deadline_from: dateRange.from,
    deadline_to: dateRange.to,
    created_from: dateRange.from,
    created_to: dateRange.to,
    is_overdue: false,
    has_report: true,
    only_current_version: true,
    include_removed: false,
    page,
    page_size: pageSize,
    sort_by: 'submitted_at',
    sort_direction: 'desc',
  };
}

function createTaskDetailsReportExportFilters(taskId: number): ReportSearchPayload {
  const dateRange = createTenYearDateRange();

  return {
    search: '',
    region_ids: [],
    task_ids: [taskId],
    user_ids: [],
    org_unit_ids: [],
    role_ids: [],
    task_types: [],
    task_scope: [],
    report_types: [],
    report_statuses: [],
    assignment_statuses: [],
    submitted_from: dateRange.from,
    submitted_to: dateRange.to,
    deadline_from: dateRange.from,
    deadline_to: dateRange.to,
    created_from: dateRange.from,
    created_to: dateRange.to,
    has_report: true,
    only_current_version: true,
    include_removed: false,
    page: 1,
    page_size: 50,
    sort_by: 'submitted_at',
    sort_direction: 'desc',
  };
}

function getReportRowKey(report: CrmReport) {
  return report.reportId ?? `${report.assignmentId}-${report.versionNumber ?? 'no-version'}`;
}

function createTenYearDateRange() {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);

  from.setFullYear(from.getFullYear() - 10);
  to.setFullYear(to.getFullYear() + 10);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

type TargetItem = {
  key: string;
  title: string;
  description: string;
  href?: string;
};

function TargetsPopover({ targets }: { targets: TargetItem[] }) {
  if (targets.length === 0) {
    return <>Не указаны</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-[#465cd3]">
          <span className="truncate">{targets.length === 1 ? targets[0].title : `Показать адресатов: ${targets.length}`}</span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(520px,calc(100vw-3rem))] p-0">
        <ScrollArea className="max-h-80">
          <div className="space-y-1 p-2">
            {targets.map((target) => {
              const content = (
                <span className="block rounded-md px-3 py-2 text-left hover:bg-slate-100">
                  <span className="block text-sm font-medium text-slate-900">{target.title}</span>
                  <span className="block text-xs text-slate-500">{target.description}</span>
                </span>
              );

              return target.href ? (
                <Link key={target.key} to={target.href}>
                  {content}
                </Link>
              ) : (
                <div key={target.key}>{content}</div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function TaskPeriod({
  scheduledAt,
  deadlineAt,
}: {
  scheduledAt?: string | null;
  deadlineAt?: string | null;
}) {
  return (
    <div className="space-y-1">
      {scheduledAt && <div>С {formatDateTime(scheduledAt)}</div>}
      <div>До {formatDateTime(deadlineAt)}</div>
    </div>
  );
}

function buildTargetItems(
  task: Task,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
): TargetItem[] {
  if (!task.targets?.length) {
    return [];
  }

  return task.targets.flatMap<TargetItem>((target) => {
    if (target.target_type === 'user') {
      const user = data.users.find((item) => item.id === target.target_id);

      return [{
        key: `${target.target_type}-${target.target_id}`,
        title: user ? `${user.fullName} (@${user.username})` : `Пользователь #${target.target_id}`,
        description: `ID: ${target.target_id}`,
        href: `/users/${target.target_id}`,
      }];
    }

    if (target.target_type === 'region') {
      const region = data.regions.find((item) => item.id === target.target_id);

      if (!region) {
        return [];
      }

      return [{
        key: `${target.target_type}-${target.target_id}`,
        title: region.name,
        description: `Код: ${region.code}`,
      }];
    }

    const orgUnit = data.orgUnits.find((item) => item.id === target.target_id);
    const region = data.regions.find((item) => item.id === orgUnit?.regionId);

    return [{
      key: `${target.target_type}-${target.target_id}`,
      title: orgUnit?.name ?? `Структура подчинения #${target.target_id}`,
      description: region ? `Регион: ${region.name}` : 'Регион не указан',
    }];
  });
}

function formatAssignmentStatus(value?: string | null) {
  const labels: Record<string, string> = {
    assigned: 'Назначено',
    in_progress: 'В работе',
    pending: 'На проверке',
    under_review: 'На проверке',
    revision_requested: 'На доработке',
    accepted: 'Принято',
    not_completed: 'Не выполнено',
    deactivated_not_completed: 'Не выполнено из-за деактивации',
  };

  return value ? labels[value] ?? value : 'Не указан';
}

function formatReportStatus(value?: string | null) {
  const labels: Record<string, string> = {
    pending: 'На проверке',
    under_review: 'На проверке',
    accepted: 'Принято',
    revision_requested: 'На доработке',
    not_completed: 'Не выполнено',
  };

  return value ? labels[value] ?? value : 'Не указан';
}

function formatNotCompletedReason(value?: string | null) {
  const labels: Record<string, string> = {
    NO_REPORT_SUBMITTED_BEFORE_DEADLINE: 'Отчет не отправлен до дедлайна',
  };

  return value ? labels[value] ?? value : 'Не указана';
}

function formatBoolean(value?: boolean | null) {
  if (value === null || value === undefined) {
    return 'Не указано';
  }

  return value ? 'Да' : 'Нет';
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Не указано';
  }

  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

function getTaskUnderReviewReportsCount(task: Task) {
  const regions = task.assignedRegions ?? task.regionsStatistics ?? [];

  return regions.reduce((total, region) => total + (region.under_review_reports ?? 0), 0);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Не указано';
  }

  return `${formatNumber(value)}%`;
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
