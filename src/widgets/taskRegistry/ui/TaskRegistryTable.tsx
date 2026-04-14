import type { Task } from "@/entities/task/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { TableScrollArea } from "@/shared/ui/table-scroll-area";
import {
  ArrowRight,
  Bell,
  FileText,
  MessageCircle,
  Pencil,
  Star,
  Trash,
  UserRound,
} from "lucide-react";

type Props = {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
};

export function TaskRegistryTable({ tasks, onTaskClick }: Props) {
  const getStatusClassName = (status: Task["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "completed":
        return "bg-slate-200 text-slate-700";
    }
  };

  return (
    <TableScrollArea headerHeight="5rem" height="70vh">
      <Table className="min-w-[1280px] whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-12 text-center">
                <Checkbox aria-label="Выбрать все задачи" />
              </TableHead>
              <TableHead className="w-20">#</TableHead>
              <TableHead className="min-w-[280px]">Название</TableHead>
              <TableHead className="w-20">Тип</TableHead>
              <TableHead className="w-36">Регион</TableHead>
              <TableHead className="min-w-[180px]">Исполнитель</TableHead>
              <TableHead className="min-w-[180px]">Время активности</TableHead>
              <TableHead className="w-14 text-center">
                <UserRound className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-14 text-center">
                <FileText className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-14 text-center">
                <MessageCircle className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-14 text-center">
                <Bell className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-14 text-center">
                <Star className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-14 text-center">
                <ArrowRight className="mx-auto size-4 text-slate-400" />
              </TableHead>
              <TableHead className="w-32">Статус</TableHead>
              <TableHead className="w-20 text-right" />
            </TableRow>
            <TableRow className="border-b border-b-slate-200 bg-white hover:bg-white">
              <TableCell className="w-12" />
              <TableCell className="w-20">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[280px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-20">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-36">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[180px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[180px]">
                <Input className="h-8 border-slate-200 text-xs" placeholder="-" />
              </TableCell>
              <TableCell className="w-14" />
              <TableCell className="w-14" />
              <TableCell className="w-14" />
              <TableCell className="w-14" />
              <TableCell className="w-14" />
              <TableCell className="w-14" />
              <TableCell className="w-32">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-20" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.map((task, index) => (
              <TableRow
                key={task.id}
                className={`cursor-pointer align-top border-b-slate-200 hover:bg-slate-50/60 ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}`}
                onClick={() => onTaskClick?.(task)}
              >
                <TableCell className="text-center">
                  <Checkbox
                    aria-label={`Выбрать задачу ${task.id}`}
                    onClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="text-slate-700">{task.id}</TableCell>
                <TableCell className="min-w-[280px]">
                  <div className="space-y-1 whitespace-normal">
                    <div className="text-sm leading-5 font-medium text-slate-900">
                      {task.title}
                    </div>
                    {task.subtitle && (
                      <div className="text-xs leading-4 text-slate-500">
                        {task.subtitle}
                      </div>
                    )}
                    {task.department && (
                      <div className="text-xs leading-4 text-rose-500">
                        {task.department}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top font-medium text-slate-700">
                  {task.type}
                </TableCell>
                <TableCell className="align-top text-slate-600">
                  {task.region}
                </TableCell>
                <TableCell className="min-w-[180px] align-top">
                  <div className="space-y-1 whitespace-normal">
                    <div className="text-sm text-slate-900">{task.assignee}</div>
                    {task.assigneeMeta && (
                      <div className="text-xs leading-4 text-slate-500">
                        {task.assigneeMeta}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px] align-top">
                  <div className="space-y-1 whitespace-normal text-sm text-slate-700">
                    {task.activityLabel && (
                      <div className="text-xs uppercase tracking-wide text-slate-400">
                        {task.activityLabel}
                      </div>
                    )}
                    <div>{task.activityStart}</div>
                    <div className="text-slate-500">{task.activityEnd}</div>
                  </div>
                </TableCell>
                {Array.from({ length: 6 }).map((_, counterIndex) => (
                  <TableCell key={counterIndex} className="text-center align-top text-slate-600">
                    {task.counters?.[counterIndex] ?? "n/a"}
                  </TableCell>
                ))}
                <TableCell className="align-top">
                  <Badge
                    className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${getStatusClassName(task.status)}`}
                  >
                    {task.statusLabel ?? task.status}
                  </Badge>
                </TableCell>
                <TableCell className="pt-3 text-right align-top">
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Trash size={15} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </TableScrollArea>
  );
}
