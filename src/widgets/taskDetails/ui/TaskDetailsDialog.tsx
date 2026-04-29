import type { Task } from "@/entities/task/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { TableScrollArea } from "@/shared/ui/table-scroll-area";
import { getStatusClassName } from "@/widgets/taskRegistry/ui/TaskRegistryTable";
import { Archive, ArchiveRestore } from "lucide-react";

function getTaskTypeLabel(type: Task["type"]) {
  const labels: Record<Task["type"], string> = {
    online_action: "Онлайн",
    street_action: "Уличная",
  };

  return labels[type];
}

type Props = {
  task: Task | null;
  open: boolean;
  isTogglingArchive?: boolean;
  onToggleArchive?: (task: Task) => void;
  onOpenChange: (open: boolean) => void;
};

export function TaskDetailsDialog({
  task,
  open,
  isTogglingArchive,
  onToggleArchive,
  onOpenChange,
}: Props) {
  if (!task) {
    return null;
  }

  const reports = task.reports ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-[95vw] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)]">
        <ScrollArea className="max-h-[90vh] w-full min-w-0 max-w-full">
          <div className="min-w-0 max-w-full space-y-8 p-6 sm:p-8">
            <div className="space-y-3">
              <DialogTitle className="pr-10 text-xl font-semibold break-words !text-slate-900 sm:text-2xl">
                Задача №{task.id} {task.title}
              </DialogTitle>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>Автор: {task.author ?? "Не указан"}</span>
                <span>Дедлайн: {task.deadlineLabel ?? task.activityEnd}</span>
                <span>
                  Назначено исполнителей: {task.assignedExecutors ?? "n/a"}
                </span>
                <span>Получено отчетов: {task.reportsCount ?? reports.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-6 xl:flex-row">
              <div className="min-w-0 flex-1 space-y-4">
                <p className="text-sm leading-6 text-slate-700">
                  {task.description ?? "Описание задачи пока не заполнено."}
                </p>

                <div className="space-y-2 text-sm text-slate-700">
                  <p>{task.questions ?? "Вопросы: не указаны"}</p>
                  <p>{task.answerFormat ?? "Ответ: не указан"}</p>
                  <div className="flex items-center gap-2">
                    <span>Статус:</span>
                    <Badge className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${getStatusClassName(task.status)}`}>
                      {task.statusLabel ?? task.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Исполнители первого звена
                  </p>
                  <p>{task.performerSummary ?? task.assignee}</p>
                </div>

                <Button
                  variant="link"
                  className="h-auto px-0 text-sm font-medium text-slate-600"
                >
                  {task.aggregatedTasksLabel ?? "Показать все агрегированные задачи"}
                </Button>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant={task.status === "archived" ? "outline" : "destructive"}
                    className="w-full sm:w-auto"
                    disabled={isTogglingArchive}
                    onClick={() => onToggleArchive?.(task)}
                  >
                    {task.status === "archived" ? <ArchiveRestore /> : <Archive />}
                    {task.status === "archived" ? "Активировать задачу" : "Архивировать задачу"}
                  </Button>
                  <Button className="w-full bg-[#4f63d8] text-white hover:bg-[#4457c4] sm:w-auto">
                    Одобрить неотклоненные отчеты
                  </Button>
                  <Button className="w-full bg-[#ef6b65] text-white hover:bg-[#db5a54] sm:w-auto">
                    Отклонить неотклоненные отчеты
                  </Button>
                  <Button className="w-full bg-sky-500 text-white hover:bg-sky-600 sm:w-auto">
                    Напомнить о задаче
                  </Button>
                </div>
              </div>

              <div className="w-full shrink-0 xl:w-[320px] 2xl:w-[360px]">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="space-y-4 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Тип
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{getTaskTypeLabel(task.type)}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Регион
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{task.region}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Исполнитель
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{task.assignee}</p>
                    {task.assigneeMeta && (
                      <p className="mt-1 text-xs text-slate-500">{task.assigneeMeta}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Активность
                    </p>
                    <p className="mt-1 text-slate-900">{task.activityStart}</p>
                    <p className="text-slate-500">{task.activityEnd}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Отчеты</h3>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Скачать ZIP
                </div>
              </div>

              <TableScrollArea className="w-full min-w-0 max-w-full" height="26rem">
                <Table className="min-w-[900px] whitespace-nowrap lg:min-w-[1180px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-24">#</TableHead>
                      <TableHead className="min-w-[220px]">Автор</TableHead>
                      <TableHead className="w-32">Команда</TableHead>
                      <TableHead className="min-w-[280px]">Содержимое</TableHead>
                      <TableHead className="min-w-[180px]">Статус</TableHead>
                      <TableHead className="w-40">Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-slate-500"
                        >
                          Для этой задачи пока нет отчетов.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map((report) => (
                        <TableRow key={report.id} className="align-top">
                          <TableCell className="font-medium text-slate-700">
                            {report.id}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">
                                {report.author}
                              </div>
                              {report.authorMeta && (
                                <div className="text-xs text-slate-500">
                                  {report.authorMeta}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {report.team}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-3">
                              <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
                                {report.attachmentLabel ?? "Вложение"}
                              </div>
                              {report.contentPreview && (
                                <p className="whitespace-normal text-sm text-slate-600">
                                  {report.contentPreview}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal text-sm text-slate-700">
                            {report.status}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {report.createdAt}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
