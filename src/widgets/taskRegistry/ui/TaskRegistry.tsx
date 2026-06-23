import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListFilter, Plus } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import {
  activateTask,
  archiveTask,
  deleteTask,
  getStatusLabel,
  getTasksPage,
  type TaskFilters,
  updateTask,
} from '@/entities/task/api/tasks';
import type { Task, TaskPayload } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import { useCurrentUserRegion } from '@/features/auth/model/useCurrentUserRegion';
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
import { FilterMultiSearchSelect } from '@/shared/ui/filter-multi-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { TaskDetailsDialog } from '@/widgets/taskDetails/ui/TaskDetailsDialog';
import { TaskEditDialog } from './TaskEditDialog';
import { TaskRegistryTable } from './TaskRegistryTable';

const emptyTaskFilters: TaskFilters = {
  title: '',
  task_type: '',
  created_by_user_id: '',
  created_from: '',
  created_to: '',
  scheduled_at_from: '',
  scheduled_at_to: '',
  deadline_at_from: '',
  deadline_at_to: '',
  org_unit_ids: [],
  region_ids: [],
  scope: '',
  status: '',
};

const emptyUsers: Awaited<ReturnType<typeof getUsers>> = [];

export function TaskRegistry() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    isRegionalManager,
    regionId: currentUserRegionId,
    isLoading: isCurrentUserRegionLoading,
  } = useCurrentUserRegion();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(emptyTaskFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);

  const taskQueryFilters = useMemo(
    () => ({
      ...filters,
      region_ids:
        filters.region_ids?.length
          ? filters.region_ids
          : isRegionalManager && currentUserRegionId
            ? [currentUserRegionId]
            : [],
    }),
    [currentUserRegionId, filters, isRegionalManager],
  );

  const tasksQuery = useQuery({
    queryKey: ['tasks', taskQueryFilters, page, size],
    queryFn: () => getTasksPage(taskQueryFilters, page, size),
    placeholderData: keepPreviousData,
    enabled: !isCurrentUserRegionLoading,
  });

  useEffect(() => {
    if (!isRegionalManager || !currentUserRegionId) {
      return;
    }

    setFilters((current) =>
      current.region_ids?.length === 1 && current.region_ids[0] === currentUserRegionId
        ? current
        : { ...current, region_ids: [currentUserRegionId] },
    );
  }, [currentUserRegionId, isRegionalManager]);

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

  const tasksPage = tasksQuery.data;
  const tasks = tasksPage?.items ?? [];
  const totalElements = tasksPage?.totalElements ?? 0;
  const totalPages = tasksPage?.totalPages ?? 1;
  const users = usersQuery.data ?? emptyUsers;

  const orgUnitOptions = useMemo(() => {
    const selectedRegionIds = filters.region_ids ?? [];

    return (orgUnitsQuery.data ?? [])
      .filter(
        (orgUnit) =>
          selectedRegionIds.length === 0 ||
          (orgUnit.regionId !== null && selectedRegionIds.includes(orgUnit.regionId)),
      )
      .map((orgUnit) => ({
        value: String(orgUnit.id),
        label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
        description: orgUnit.regionName ?? 'Регион не указан',
      }));
  }, [filters.region_ids, orgUnitsQuery.data]);

  const updateFilters = useCallback((patch: TaskFilters) => {
    setPage(1);
    setFilters((current) => {
      const nextFilters = { ...current, ...patch };

      if (patch.region_ids) {
        const allowedOrgUnitIds = new Set(
          (orgUnitsQuery.data ?? [])
            .filter(
              (orgUnit) =>
                patch.region_ids?.length === 0 ||
                (orgUnit.regionId !== null && patch.region_ids?.includes(orgUnit.regionId)),
            )
            .map((orgUnit) => orgUnit.id),
        );

        nextFilters.org_unit_ids = (current.org_unit_ids ?? []).filter((orgUnitId) =>
          allowedOrgUnitIds.has(orgUnitId),
        );
      }

      return nextFilters;
    });
  }, [orgUnitsQuery.data]);

  const changeSize = useCallback((nextSize: number) => {
    setPage(1);
    setSize(nextSize);
  }, []);

  const openTaskPage = useCallback((task: Task) => {
    navigate(`/tasks/${task.id}`);
  }, [navigate]);

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
              <FilterInput
                label="Создана от"
                type="datetime"
                value={filters.created_from}
                onChange={(created_from) => updateFilters({ created_from })}
              />
              <FilterInput
                label="Создана до"
                type="datetime"
                value={filters.created_to}
                onChange={(created_to) => updateFilters({ created_to })}
              />
              <FilterInput
                label="Активирована от"
                type="datetime"
                value={filters.scheduled_at_from}
                onChange={(scheduled_at_from) => updateFilters({ scheduled_at_from })}
              />
              <FilterInput
                label="Активирована до"
                type="datetime"
                value={filters.scheduled_at_to}
                onChange={(scheduled_at_to) => updateFilters({ scheduled_at_to })}
              />
              <FilterInput
                label="Дедлайн от"
                type="datetime"
                value={filters.deadline_at_from}
                onChange={(deadline_at_from) => updateFilters({ deadline_at_from })}
              />
              <FilterInput
                label="Дедлайн до"
                type="datetime"
                value={filters.deadline_at_to}
                onChange={(deadline_at_to) => updateFilters({ deadline_at_to })}
              />
              <FilterMultiSearchSelect
                label="Регион"
                values={(filters.region_ids ?? []).map(String)}
                disabled={isRegionalManager}
                placeholder="Все регионы"
                searchPlaceholder="Поиск региона"
                options={(regionsQuery.data ?? []).map((region) => ({
                  value: String(region.id),
                  label: region.name,
                }))}
                onChange={(regionIds) => updateFilters({ region_ids: toNumbers(regionIds) })}
              />
              <FilterMultiSearchSelect
                label="Структура подчинения"
                values={(filters.org_unit_ids ?? []).map(String)}
                placeholder="Все структуры подчинения"
                searchPlaceholder="Поиск структуры подчинения"
                options={orgUnitOptions}
                onChange={(orgUnitIds) => updateFilters({ org_unit_ids: toNumbers(orgUnitIds) })}
              />
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  setFilters({
                    ...emptyTaskFilters,
                    region_ids:
                      isRegionalManager && currentUserRegionId
                        ? [currentUserRegionId]
                        : [],
                  });
                }}
              >
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
          <>
            <TaskRegistryTable
              tasks={tasks}
              filters={filters}
              users={users}
              togglingTaskId={togglingTaskId}
              deletingTaskId={deletingTaskId}
              onFiltersChange={updateFilters}
              onTaskClick={openTaskPage}
              onToggleArchive={(task) => toggleArchiveMutation.mutate(task)}
              onDelete={setDeletingTask}
            />
            <TaskPagination
              page={page}
              size={size}
              totalElements={totalElements}
              totalPages={totalPages}
              onPageChange={setPage}
              onSizeChange={changeSize}
            />
          </>
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

function TaskPagination({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
}: {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (!pageInput.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextPage = clampPage(Number(pageInput) || 1, safeTotalPages);

      if (nextPage !== page) {
        onPageChange(nextPage);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [onPageChange, page, pageInput, safeTotalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Назад
        </Button>
        <span className="text-sm text-slate-500">
          Страница
        </span>
        <Input
          className="h-9 w-20 border-slate-200 bg-white text-sm"
          min={1}
          max={safeTotalPages}
          type="number"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
        />
        <span className="text-sm text-slate-500">из {safeTotalPages}</span>
        <Button
          type="button"
          variant="outline"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Вперед
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">Всего: {totalElements}</span>
        <Select value={String(size)} onValueChange={(value) => onSizeChange(Number(value))}>
          <SelectTrigger className="h-9 w-24 border-slate-200 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(totalPages, 1));
}

function toNumbers(values: string[]) {
  return values.map(Number).filter(Number.isFinite);
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
