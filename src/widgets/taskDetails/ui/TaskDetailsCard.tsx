import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, ChevronsUpDown, Copy, ExternalLink, Pencil, UserCheck } from 'lucide-react';

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
import { TaskEditDialog } from '@/widgets/taskRegistry/ui/TaskEditDialog';
import { getStatusClassName } from '@/widgets/taskRegistry/ui/TaskRegistryTable';

type Props = {
  task: Task;
  isTogglingArchive?: boolean;
  showOpenPageLink?: boolean;
  onToggleArchive?: (task: Task) => void;
};

export function TaskDetailsCard({
  task,
  isTogglingArchive,
  showOpenPageLink = false,
  onToggleArchive,
}: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
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
        <InfoItem label="Дедлайн" value={formatDateTime(task.deadlineAt)} />
        <InfoItem label="Запланирована на" value={formatDateTime(task.scheduledAt)} />
        <InfoItem label="Создана" value={formatDateTime(task.createdAt)} />
        <InfoItem label="Обновлена" value={formatDateTime(task.updatedAt)} />
        <InfoItem label="Автор" value={<AuthorLink author={authorQuery.data} authorId={task.createdByUserId} />} />
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
    </>
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
