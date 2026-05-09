import type { Task } from '@/entities/task/model/types';
import { getReportFormatLabel, getScopeLabel, getStatusLabel } from '@/entities/task/api/tasks';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';
import { Archive, ArchiveRestore, Pencil } from 'lucide-react';

type Props = {
  tasks: Task[];
  togglingTaskId?: number | null;
  onTaskClick?: (task: Task) => void;
  onToggleArchive?: (task: Task) => void;
  onEdit?: (task: Task) => void;
};

export function TaskRegistryTable({
  tasks,
  togglingTaskId,
  onTaskClick,
  onToggleArchive,
  onEdit,
}: Props) {
  return (
    <TableScrollArea headerHeight="3rem" height="70vh">
      <Table className="min-w-[980px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-24">#</TableHead>
            <TableHead className="min-w-[320px]">Название</TableHead>
            <TableHead className="w-36">Уровень</TableHead>
            <TableHead className="w-40">Тип</TableHead>
            <TableHead className="w-36">Отчет</TableHead>
            <TableHead className="w-44">Дедлайн</TableHead>
            <TableHead className="w-44">Создана</TableHead>
            <TableHead className="w-32">Статус</TableHead>
            <TableHead className="w-24 text-right" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">
                Задач пока нет.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task, index) => (
              <TableRow
                key={task.id}
                className={`cursor-pointer align-top border-b-slate-200 hover:bg-slate-50/60 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
                }`}
                onClick={() => onTaskClick?.(task)}
              >
                <TableCell className="font-medium text-slate-700">{task.id}</TableCell>
                <TableCell className="min-w-[320px]">
                  <div className="space-y-1 whitespace-normal">
                    <div className="text-sm leading-5 font-medium text-slate-900">
                      {task.title}
                    </div>
                    {task.subtitle && (
                      <div className="text-xs leading-4 text-slate-500">{task.subtitle}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top text-slate-700">
                  {getScopeLabel(task.scope ?? task.region)}
                </TableCell>
                <TableCell className="align-top text-slate-700">{task.taskType ?? task.type}</TableCell>
                <TableCell className="align-top text-slate-700">
                  {getReportFormatLabel(task.reportFormat ?? '')}
                </TableCell>
                <TableCell className="align-top text-slate-700">{task.deadlineLabel}</TableCell>
                <TableCell className="align-top text-slate-700">
                  {task.createdAt ? formatDateTime(task.createdAt) : 'n/a'}
                </TableCell>
                <TableCell className="align-top">
                  <Badge
                    className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${getStatusClassName(task.status)}`}
                  >
                    {task.statusLabel ?? getStatusLabel(task.status)}
                  </Badge>
                </TableCell>
                <TableCell className="pt-3 text-right align-top">
                  <div className="flex justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit?.(task);
                            }}
                            aria-label={`Редактировать задачу ${task.id}`}
                          >
                            <Pencil size={15} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Редактировать</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                                        <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            disabled={togglingTaskId === task.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleArchive?.(task);
                            }}
                            aria-label={
                              task.status === 'archived'
                                ? `Активировать задачу ${task.id}`
                                : `Архивировать задачу ${task.id}`
                            }
                          >
                            {task.status === 'archived' ? (
                              <ArchiveRestore size={15} />
                            ) : (
                              <Archive size={15} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{task.status === 'archived' ? 'Активировать' : 'Архивировать'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableScrollArea>
  );
}

export function getStatusClassName(status: Task['status']) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'scheduled':
      return 'bg-sky-100 text-sky-700';
    case 'pending':
    case 'draft':
      return 'bg-amber-100 text-amber-700';
    case 'completed':
      return 'bg-slate-200 text-slate-700';
    case 'archived':
      return 'bg-zinc-200 text-zinc-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
