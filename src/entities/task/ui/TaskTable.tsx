import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import type { Task } from "../model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Pencil, Trash } from "lucide-react";

interface Props {
  tasks: Task[];
}

export const TasksTable = ({ tasks }: Props) => {
  const getStatusVariant = (status: Task["status"]) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
    }
  };

  return (
    <div className="bg-white rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Регион</TableHead>
            <TableHead>Исполнитель</TableHead>
            <TableHead>Время активности</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.id}</TableCell>

              <TableCell className="max-w-[250px]">
                <div className="font-medium leading-tight">
                  {task.title}
                </div>
              </TableCell>

              <TableCell>{task.type}</TableCell>

              <TableCell>{task.region}</TableCell>

              <TableCell>{task.assignee}</TableCell>

              <TableCell>
                <div className="text-sm">
                  <div>{task.activityStart}</div>
                  <div className="text-muted-foreground">
                    {task.activityEnd}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant={getStatusVariant(task.status)}>
                  {task.status}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Pencil size={16} />
                  </Button>

                  <Button size="icon" variant="ghost">
                    <Trash size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};