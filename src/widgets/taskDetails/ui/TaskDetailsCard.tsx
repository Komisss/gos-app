import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, ChevronsUpDown, Copy, ExternalLink, Pencil, Trash2, UserCheck } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import type { Task } from '@/entities/task/model/types';
import {
  getReportFormatLabel,
  getScopeLabel,
  getStatusLabel,
  getTaskTypeLabel,
  deleteTask,
  materializeTaskAssignments,
  updateTask,
} from '@/entities/task/api/tasks';
import type { TaskPayload } from '@/entities/task/model/types';
import { getUserById, getUsers } from '@/entities/user/api/users';
import type { UserDetails, UserListItem } from '@/entities/user/model/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
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
import { TaskEditDialog } from '@/widgets/taskRegistry/ui/TaskEditDialog';
import { getStatusClassName } from '@/widgets/taskRegistry/ui/TaskRegistryTable';

type Props = {
  task: Task;
  isTogglingArchive?: boolean;
  showOpenPageLink?: boolean;
  onToggleArchive?: (task: Task) => void;
  onDeleted?: () => void;
};

export function TaskDetailsCard({
  task,
  isTogglingArchive,
  showOpenPageLink = false,
  onToggleArchive,
  onDeleted,
}: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const hasTargets = Boolean(task.targets?.length);
  const canMaterializeAssignments =
    hasTargets && (task.status === 'active' || task.status === 'scheduled');
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
    enabled: Boolean(task.targets?.some((target) => target.target_type === 'region' || target.target_type === 'org_unit')),
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

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: async (_data, variables) => {
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const materializeAssignmentsMutation = useMutation({
    mutationFn: () => materializeTaskAssignments(task.id),
    onSuccess: async () => {
      setAssignConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (task.isMaterialized) {
        throw new Error('Task cannot be deleted after assignments are materialized.');
      }

      return deleteTask(task.id);
    },
    onSuccess: async () => {
      setDeleteConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      onDeleted?.();
    },
  });

  async function handleCopyTaskLink() {
    const link = `${window.location.origin}/tasks/${task.id}`;

    try {
      setIsCopyingLink(true);
      await navigator.clipboard.writeText(link);
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
          {task.shortDescription && (
            <p className="max-w-4xl text-sm leading-6 text-slate-600">{task.shortDescription}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
          <Button type="button" variant="outline" className="border-slate-200" onClick={() => setEditOpen(true)}>
            <Pencil />
            Редактировать
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            disabled={!canMaterializeAssignments || materializeAssignmentsMutation.isPending}
            onClick={() => setAssignConfirmOpen(true)}
          >
            <UserCheck />
            Назначить исполнителей
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={task.isMaterialized || deleteMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 />
            Удалить
          </Button>
          {showOpenPageLink && (
            <Button asChild variant="outline" className="border-slate-200">
              <Link to={`/tasks/${task.id}`}>
                <ExternalLink />
                Открыть страницу
              </Link>
            </Button>
          )}
          {onToggleArchive && (
            <Button
              type="button"
              variant={task.status === 'archived' ? 'outline' : 'destructive'}
              disabled={isTogglingArchive}
              onClick={() => onToggleArchive(task)}
            >
              {task.status === 'archived' ? <ArchiveRestore /> : <Archive />}
              {task.status === 'archived' ? 'Активировать' : 'Архивировать'}
            </Button>
          )}
        </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Уровень" value={getScopeLabel(task.scope ?? '')} />
        <InfoItem label="Тип задачи" value={getTaskTypeLabel(task.taskType ?? task.type)} />
        <InfoItem label="Формат отчета" value={getReportFormatLabel(task.reportFormat ?? '')} />
        <InfoItem label="Лимит правок" value={task.revisionLimit ?? 'Не указан'} />
        <InfoItem label="Исполнители" value={task.isMaterialized ? 'Назначены' : 'Не назначены'} />
        <InfoItem label="Дедлайн" value={formatDateTime(task.deadlineAt)} />
        <InfoItem label="Запланирована на" value={formatDateTime(task.scheduledAt)} />
        <InfoItem label="Создана" value={formatDateTime(task.createdAt)} />
        <InfoItem label="Обновлена" value={formatDateTime(task.updatedAt)} />
        <InfoItem label="Автор" value={<AuthorLink author={authorQuery.data} authorId={task.createdByUserId} />} />
        <InfoItem label="Роль автора" value={formatRole(task.createdByRole)} />
        <InfoItem label="Назначений" value={formatNumber(task.assignmentsCount)} />
        <InfoItem label="Уведомлений" value={formatNumber(task.notificationsCount)} />
        <InfoItem label="Ожидают отправки" value={formatNumber(task.pendingNotificationsCount)} />
        <InfoItem label="Отправлено" value={formatNumber(task.sentNotificationsCount)} />
        <InfoItem label="Ошибок отправки" value={formatNumber(task.failedNotificationsCount)} />
        <InfoItem
          label="Адресаты"
          value={<TargetsPopover targets={targetItems} />}
          className="md:col-span-2 xl:col-span-3"
        />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Полное описание</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {task.fullDescription || task.description || 'Описание задачи пока не заполнено.'}
          </p>
        </section>

        <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-900">Комментарий для исполнителя</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {task.commentForExecutor || 'Комментарий не указан.'}
          </p>
        </aside>
        </div>

        <TaskAssignmentIds ids={task.taskAssignmentIds ?? []} />
        <TaskAssignmentsTable assignments={task.taskAssignments ?? []} />
        <TaskRegionsStatisticsTable statistics={task.regionsStatistics ?? []} />
        <TaskReportsTable reports={task.taskReports ?? []} onReportClick={setSelectedReportId} />
      </article>

      <TaskEditDialog
        task={task}
        open={editOpen}
        isSubmitting={updateMutation.isPending}
        onOpenChange={setEditOpen}
        onSubmit={(taskId, payload) => updateMutation.mutate({ taskId, payload })}
      />

      <Dialog open={assignConfirmOpen} onOpenChange={setAssignConfirmOpen}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Запустить назначение исполнителей?</DialogTitle>
            <DialogDescription>
              Система создаст назначения по выбранным адресатам задачи.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignConfirmOpen(false)}
              disabled={materializeAssignmentsMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => materializeAssignmentsMutation.mutate()}
              disabled={materializeAssignmentsMutation.isPending}
            >
              {materializeAssignmentsMutation.isPending ? 'Запуск...' : 'Запустить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Удалить задачу?</DialogTitle>
            <DialogDescription>
              Задача будет удалена без архивирования. Удаление доступно только пока исполнители не назначены.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось удалить задачу.
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={task.isMaterialized || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
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
    </>
  );
}

function TaskAssignmentIds({ ids }: { ids: number[] }) {
  if (ids.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-base font-semibold text-slate-900">ID назначений</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {ids.map((id) => (
          <Badge key={id} className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            #{id}
          </Badge>
        ))}
      </div>
    </section>
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
            <TableHead>Оргструктура</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Назначено</TableHead>
            <TableHead>Дедлайн</TableHead>
            <TableHead>Просрочено</TableHead>
            <TableHead>Правки</TableHead>
            <TableHead>Завершено</TableHead>
            <TableHead>Причина невыполнения</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.task_assignment_id}>
              <TableCell>#{assignment.task_assignment_id}</TableCell>
              <TableCell>
                <Link to={`/users/${assignment.user_id}`} className="text-[#465cd3] hover:underline">
                  {assignment.user_full_name || `Пользователь #${assignment.user_id}`}
                </Link>
              </TableCell>
              <TableCell>{assignment.region_name ?? 'Не указан'}</TableCell>
              <TableCell>{assignment.org_unit_name ?? 'Не указана'}</TableCell>
              <TableCell>{formatAssignmentStatus(assignment.status)}</TableCell>
              <TableCell>{formatDateTime(assignment.assigned_at)}</TableCell>
              <TableCell>{formatDateTime(assignment.deadline_at)}</TableCell>
              <TableCell>{formatBoolean(assignment.is_overdue)}</TableCell>
              <TableCell>
                {formatNumber(assignment.revision_used)} / {formatNumber(assignment.revision_limit)}
              </TableCell>
              <TableCell>{formatDateTime(assignment.completed_at)}</TableCell>
              <TableCell>{formatNotCompletedReason(assignment.not_completed_reason)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TaskDataSection>
  );
}

function TaskRegionsStatisticsTable({ statistics }: { statistics: NonNullable<Task['regionsStatistics']> }) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <TaskDataSection title="Статистика по регионам">
      <Table className="min-w-[1100px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>Регион</TableHead>
            <TableHead>Назначения</TableHead>
            <TableHead>С отчетами</TableHead>
            <TableHead>Без отчетов</TableHead>
            <TableHead>Отчеты</TableHead>
            <TableHead>На проверке</TableHead>
            <TableHead>Принято</TableHead>
            <TableHead>На доработке</TableHead>
            <TableHead>Не выполнено</TableHead>
            <TableHead>Просрочено</TableHead>
            <TableHead>Выполнение</TableHead>
            <TableHead>Отправка</TableHead>
            <TableHead>Просрочки</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statistics.map((item) => (
            <TableRow key={item.region_id}>
              <TableCell>{item.region_name}</TableCell>
              <TableCell>{formatNumber(item.assignments_count)}</TableCell>
              <TableCell>{formatNumber(item.assignments_with_reports)}</TableCell>
              <TableCell>{formatNumber(item.assignments_without_reports)}</TableCell>
              <TableCell>{formatNumber(item.reports_count)}</TableCell>
              <TableCell>{formatNumber(item.under_review_reports)}</TableCell>
              <TableCell>{formatNumber(item.accepted_reports)}</TableCell>
              <TableCell>{formatNumber(item.revision_requested_reports)}</TableCell>
              <TableCell>{formatNumber(item.not_completed_assignments)}</TableCell>
              <TableCell>{formatNumber(item.overdue_assignments)}</TableCell>
              <TableCell>{formatPercent(item.completion_rate)}</TableCell>
              <TableCell>{formatPercent(item.submission_rate)}</TableCell>
              <TableCell>{formatPercent(item.overdue_rate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TaskDataSection>
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
            <TableHead>Оргструктура</TableHead>
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

function AuthorLink({ author, authorId }: { author?: UserDetails; authorId?: number }) {
  if (!authorId) {
    return <>Не указан</>;
  }

  return (
    <Link to={`/users/${authorId}`} className="text-[#465cd3] hover:underline">
      {author ? `${author.fullName} (@${author.username})` : `Пользователь #${authorId}`}
    </Link>
  );
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

function buildTargetItems(
  task: Task,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
): TargetItem[] {
  if (!task.targets?.length) {
    return [];
  }

  return task.targets.map((target) => {
    if (target.target_type === 'user') {
      const user = data.users.find((item) => item.id === target.target_id);

      return {
        key: `${target.target_type}-${target.target_id}`,
        title: user ? `${user.fullName} (@${user.username})` : `Пользователь #${target.target_id}`,
        description: `ID: ${target.target_id}`,
        href: `/users/${target.target_id}`,
      };
    }

    if (target.target_type === 'region') {
      const region = data.regions.find((item) => item.id === target.target_id);

      return {
        key: `${target.target_type}-${target.target_id}`,
        title: region?.name ?? `Регион #${target.target_id}`,
        description: region ? `Код: ${region.code}` : `ID: ${target.target_id}`,
      };
    }

    const orgUnit = data.orgUnits.find((item) => item.id === target.target_id);
    const region = data.regions.find((item) => item.id === orgUnit?.regionId);

    return {
      key: `${target.target_type}-${target.target_id}`,
      title: orgUnit?.name ?? `Оргструктура #${target.target_id}`,
      description: region ? `Регион: ${region.name}` : 'Регион не указан',
    };
  });
}

function formatRole(value?: string | null) {
  const labels: Record<string, string> = {
    federal_manager: 'Федеральный управляющий',
    regional_manager: 'Региональный руководитель',
    executor: 'Исполнитель',
    main_manager: 'Главный менеджер',
    assistant: 'Помощник главного менеджера',
    unit_head: 'Руководитель управления',
    department_head: 'Руководитель отдела',
    employee: 'Сотрудник',
  };

  return value ? labels[value] ?? value : 'Не указана';
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
