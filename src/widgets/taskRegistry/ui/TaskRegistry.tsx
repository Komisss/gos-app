import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { archiveTask, getTasks, updateTask } from '@/entities/task/api/tasks';
import type { Task, TaskPayload } from '@/entities/task/model/types';
import { Button } from '@/shared/ui/button';
import { CardTitle } from '@/shared/ui/card';
import { TaskDetailsDialog } from '@/widgets/taskDetails/ui/TaskDetailsDialog';
import { TaskEditDialog } from './TaskEditDialog';
import { TaskRegistryTable } from './TaskRegistryTable';

export function TaskRegistry() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [archivingTaskId, setArchivingTaskId] = useState<number | null>(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const archiveMutation = useMutation({
    mutationFn: archiveTask,
    onMutate: (taskId) => setArchivingTaskId(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => setArchivingTaskId(null),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: async () => {
      setEditingTask(null);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const tasks = tasksQuery.data ?? [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-semibold text-slate-900">Задачи</CardTitle>
          </div>

          <Button asChild className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
            <Link to="/tasks/new">
              <Plus />
              Добавить задачу
            </Link>
          </Button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем задачи...
          </div>
        ) : tasksQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить список задач.
          </div>
        ) : (
          <TaskRegistryTable
            tasks={tasks}
            archivingTaskId={archivingTaskId}
            onTaskClick={setSelectedTask}
            onEdit={setEditingTask}
            onArchive={(task) => archiveMutation.mutate(task.id)}
          />
        )}

        <TaskDetailsDialog
          open={selectedTask !== null}
          task={selectedTask}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null);
            }
          }}
        />

        <TaskEditDialog
          open={editingTask !== null}
          task={editingTask}
          isSubmitting={updateMutation.isPending}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTask(null);
            }
          }}
          onSubmit={(taskId, payload) => updateMutation.mutate({ taskId, payload })}
        />
      </div>
    </div>
  );
}
