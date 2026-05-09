import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { activateTask, archiveTask, getStatusLabel, getTaskById } from '@/entities/task/api/tasks';
import type { Task } from '@/entities/task/model/types';
import { TaskDetailsCard } from '@/widgets/taskDetails/ui/TaskDetailsCard';

export default function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericTaskId = Number(taskId);

  const taskQuery = useQuery({
    queryKey: ['task', numericTaskId],
    queryFn: () => getTaskById(numericTaskId),
    enabled: Number.isFinite(numericTaskId),
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: (task: Task) => (task.status === 'archived' ? activateTask(task.id) : archiveTask(task.id)),
    onSuccess: async (_data, task) => {
      const nextStatus = task.status === 'archived' ? 'active' : 'archived';
      queryClient.setQueryData<Task>(['task', task.id], (currentTask) =>
        currentTask
          ? { ...currentTask, status: nextStatus, statusLabel: getStatusLabel(nextStatus) }
          : currentTask,
      );
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-6">
        {taskQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем задачу...
          </div>
        ) : taskQuery.isError || !taskQuery.data ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить задачу.
          </div>
        ) : (
          <TaskDetailsCard
            task={taskQuery.data}
            isTogglingArchive={toggleArchiveMutation.isPending}
            onToggleArchive={(task) => toggleArchiveMutation.mutate(task)}
            onDeleted={() => navigate('/tasks')}
          />
        )}
      </div>
    </div>
  );
}
