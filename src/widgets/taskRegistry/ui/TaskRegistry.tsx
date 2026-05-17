import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListFilter, Plus } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import {
  activateTask,
  archiveTask,
  deleteTask,
  getStatusLabel,
  getTasks,
  type TaskFilters,
  updateTask,
} from '@/entities/task/api/tasks';
import type { Task, TaskPayload } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import { Button } from '@/shared/ui/button';
import { CardTitle } from '@/shared/ui/card';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { TaskDetailsDialog } from '@/widgets/taskDetails/ui/TaskDetailsDialog';
import { TaskEditDialog } from './TaskEditDialog';
import { TaskRegistryTable } from './TaskRegistryTable';

const emptyTaskFilters: TaskFilters = {
  created_by_user_id: '',
  created_from: '',
  created_to: '',
  org_unit: '',
  region_id: '',
  scope: '',
  status: '',
};

export function TaskRegistry() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(emptyTaskFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: (task: Task) => (task.status === 'archived' ? activateTask(task.id) : archiveTask(task.id)),
    onMutate: (task) => setTogglingTaskId(task.id),
    onSuccess: async (_data, task) => {
      const nextStatus = task.status === 'archived' ? 'active' : 'archived';
      setSelectedTask((currentTask) =>
        currentTask?.id === task.id
          ? { ...currentTask, status: nextStatus, statusLabel: getStatusLabel(nextStatus) }
          : currentTask,
      );
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    },
    onSettled: () => setTogglingTaskId(null),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: async () => {
      setEditingTask(null);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (task: Task) => {
      if (task.isMaterialized) {
        throw new Error('Task cannot be deleted after assignments are materialized.');
      }

      return deleteTask(task.id);
    },
    onMutate: (task) => setDeletingTaskId(task.id),
    onSuccess: async (_data, task) => {
      setDeletingTask(null);
      setSelectedTask((currentTask) => (currentTask?.id === task.id ? null : currentTask));
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    },
    onSettled: () => setDeletingTaskId(null),
  });

  const tasks = tasksQuery.data ?? [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-3xl font-semibold text-slate-900">Задачи</CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <ListFilter />
              Фильтры
            </Button>
            <Button asChild className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
              <Link to="/tasks/new">
                <Plus />
                Добавить задачу
              </Link>
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterSearchSelect
                label="Автор"
                value={filters.created_by_user_id}
                placeholder="Все авторы"
                searchPlaceholder="Поиск по ФИО или логину"
                options={(usersQuery.data ?? []).map((user) => ({
                  value: String(user.id),
                  label: user.fullName,
                  description: `@${user.username}`,
                }))}
                onChange={(created_by_user_id) => setFilters((current) => ({ ...current, created_by_user_id }))}
              />
              <FilterInput
                label="Создана от"
                type="datetime"
                value={filters.created_from}
                onChange={(created_from) => setFilters((current) => ({ ...current, created_from }))}
              />
              <FilterInput
                label="Создана до"
                type="datetime"
                value={filters.created_to}
                onChange={(created_to) => setFilters((current) => ({ ...current, created_to }))}
              />
              <FilterSearchSelect
                label="Оргструктура"
                value={filters.org_unit}
                placeholder="Все оргструктуры"
                searchPlaceholder="Поиск оргструктуры"
                options={(orgUnitsQuery.data ?? []).map((orgUnit) => ({
                  value: String(orgUnit.id),
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                }))}
                onChange={(org_unit) => setFilters((current) => ({ ...current, org_unit }))}
              />
              <FilterSearchSelect
                label="Регион"
                value={filters.region_id}
                placeholder="Все регионы"
                searchPlaceholder="Поиск региона"
                options={(regionsQuery.data ?? []).map((region) => ({
                  value: String(region.id),
                  label: region.name,
                }))}
                onChange={(region_id) => setFilters((current) => ({ ...current, region_id }))}
              />
              <FilterSelect
                label="Уровень"
                value={filters.scope}
                placeholder="Все"
                options={[
                  { value: '1', label: 'Региональный' },
                  { value: '2', label: 'Федеральный' },
                ]}
                onChange={(scope) => setFilters((current) => ({ ...current, scope }))}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 !mb-1">Статус</p>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(status) =>
                    setFilters((current) => ({ ...current, status: status === 'all' ? '' : status }))
                  }
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="draft">Черновик</SelectItem>
                    <SelectItem value="active">Активная</SelectItem>
                    <SelectItem value="pending">В работе</SelectItem>
                    <SelectItem value="completed">Завершена</SelectItem>
                    <SelectItem value="archived">В архиве</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setFilters(emptyTaskFilters)}>
                Сбросить фильтры
              </Button>
            </div>
          </div>
        )}

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
            togglingTaskId={togglingTaskId}
            deletingTaskId={deletingTaskId}
            onTaskClick={setSelectedTask}
            onEdit={setEditingTask}
            onToggleArchive={(task) => toggleArchiveMutation.mutate(task)}
            onDelete={setDeletingTask}
          />
        )}

        <TaskDetailsDialog
          open={selectedTask !== null}
          task={selectedTask}
          isTogglingArchive={togglingTaskId === selectedTask?.id}
          onToggleArchive={(task) => toggleArchiveMutation.mutate(task)}
          onDeleted={() => setSelectedTask(null)}
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

        <Dialog open={deletingTask !== null} onOpenChange={(open) => !open && setDeletingTask(null)}>
          <DialogContent className="max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Удалить задачу?</DialogTitle>
              <DialogDescription>
                Задача будет удалена без архивирования. Действие доступно только пока исполнители не назначены.
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
                onClick={() => setDeletingTask(null)}
                disabled={deleteMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={Boolean(deletingTask?.isMaterialized) || deleteMutation.isPending}
                onClick={() => deletingTask && deleteMutation.mutate(deletingTask)}
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: 'number' | 'datetime';
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      {type === 'datetime' ? (
        <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
      ) : (
        <Input
          type="number"
          className="h-9 border-slate-200 text-sm"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Select value={value || 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? '' : nextValue)}>
        <SelectTrigger className="w-full border-slate-200 bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
