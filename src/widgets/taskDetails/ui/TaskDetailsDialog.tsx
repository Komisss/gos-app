import { useQuery } from '@tanstack/react-query';

import { getTaskById } from '@/entities/task/api/tasks';
import type { Task } from '@/entities/task/model/types';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { TaskDetailsCard } from './TaskDetailsCard';

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
  const taskQuery = useQuery({
    queryKey: ['task', task?.id],
    queryFn: () => getTaskById(task?.id ?? 0),
    enabled: open && Boolean(task?.id),
  });

  const detailsTask = taskQuery.data ?? task;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-[1100px] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Карточка задачи</DialogTitle>
        <ScrollArea className="max-h-[90vh] w-full">
          <div className="p-4 sm:p-6">
            {taskQuery.isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Загружаем задачу...
              </div>
            ) : taskQuery.isError || !detailsTask ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
                Не удалось загрузить задачу.
              </div>
            ) : (
              <TaskDetailsCard
                task={detailsTask}
                isTogglingArchive={isTogglingArchive}
                showOpenPageLink
                onToggleArchive={onToggleArchive}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
