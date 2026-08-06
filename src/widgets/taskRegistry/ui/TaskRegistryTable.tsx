import { memo, useEffect, useMemo, useState, type UIEvent } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import {
  getScopeLabel,
  getStatusLabel,
  getTaskTypeLabel,
  type TaskFilters,
} from '@/entities/task/api/tasks';
import type { Task } from '@/entities/task/model/types';
import { getUsersPage } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

const AUTHOR_FILTER_PAGE_SIZE = 50;

type Props = {
  tasks: Task[];
  filters: TaskFilters;
  users: UserListItem[];
  togglingTaskId?: number | null;
  deletingTaskId?: number | null;
  onFiltersChange: (filters: TaskFilters) => void;
  onTaskClick?: (task: Task) => void;
  onToggleArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export const TaskRegistryTable = memo(function TaskRegistryTable({
  tasks,
  filters,
  users,
  onFiltersChange,
  onTaskClick,
}: Props) {
  return (
    <TableScrollArea headerHeight="5rem" height="70vh">
      <Table className="min-w-[900px] whitespace-nowrap">
        <TaskRegistryTableHeader filters={filters} users={users} onFiltersChange={onFiltersChange} />
        <TaskRegistryTableBody tasks={tasks} users={users} onTaskClick={onTaskClick} />
      </Table>
    </TableScrollArea>
  );
});

const TaskRegistryTableHeader = memo(function TaskRegistryTableHeader({
  filters,
  users,
  onFiltersChange,
}: {
  filters: TaskFilters;
  users: UserListItem[];
  onFiltersChange: (filters: TaskFilters) => void;
}) {
  return (
    <TableHeader>
      <TableRow className="border-b-slate-200 bg-white hover:bg-white">
        <TableHead className="w-24" />
        <TableHead className="min-w-[320px] align-bottom">
          <HeaderSearchInput
            value={filters.title}
            placeholder="Поиск по названию"
            onChange={(title) => onFiltersChange({ title })}
          />
        </TableHead>
        <TableHead className="min-w-[220px] align-bottom">
          <InfiniteAuthorSearchSelect
            label=""
            value={filters.created_by_user_id}
            placeholder="Все авторы"
            searchPlaceholder="Поиск по ФИО или логину"
            fallbackUsers={users}
            onChange={(created_by_user_id) => onFiltersChange({ created_by_user_id })}
          />
        </TableHead>
        <TableHead className="w-36 align-bottom">
          <HeaderSelect
            value={filters.scope}
            placeholder="Все уровни"
            options={[
              { value: 'regional', label: 'Региональный' },
              { value: 'federal', label: 'Федеральный' },
            ]}
            onChange={(scope) => onFiltersChange({ scope })}
          />
        </TableHead>
        <TableHead className="w-40 align-bottom">
          <HeaderSelect
            value={filters.task_type}
            placeholder="Все типы"
            options={[
              { value: 'online_action', label: 'Онлайн-акция' },
              { value: 'street_action', label: 'Уличная акция' },
            ]}
            onChange={(task_type) => onFiltersChange({ task_type })}
          />
        </TableHead>
        <TableHead className="w-44" />
        <TableHead className="w-32 align-bottom">
          <HeaderSelect
            value={filters.status}
            placeholder="Все статусы"
            options={[
              { value: 'scheduled', label: 'Запланирована' },
              { value: 'active', label: 'Активная' },
              { value: 'completed', label: 'Завершена' },
              { value: 'archived', label: 'В архиве' },
            ]}
            onChange={(status) => onFiltersChange({ status })}
          />
        </TableHead>
      </TableRow>
      <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
        <TableHead className="w-24">#</TableHead>
        <TableHead className="min-w-[320px]">Название</TableHead>
        <TableHead className="min-w-[220px]">Автор</TableHead>
        <TableHead className="w-36">Уровень</TableHead>
        <TableHead className="w-40">Тип</TableHead>
        <TableHead className="w-44">Дедлайн</TableHead>
        <TableHead className="w-32">Статус</TableHead>
      </TableRow>
    </TableHeader>
  );
});

const TaskRegistryTableBody = memo(function TaskRegistryTableBody({
  tasks,
  users,
  onTaskClick,
}: {
  tasks: Task[];
  users: UserListItem[];
  onTaskClick?: (task: Task) => void;
}) {
  return (
    <TableBody>
      {tasks.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
            Задач пока нет.
          </TableCell>
        </TableRow>
      ) : (
        tasks.map((task, index) => (
          <TableRow
            key={task.id}
            className={`cursor-pointer align-top border-b-slate-200 ${index % 2 === 0 ? 'bg-white hover:bg-sky-50' : 'bg-sky-50/40 hover:bg-sky-100/70'}`}
            onClick={() => onTaskClick?.(task)}
          >
            <TableCell className="font-medium text-slate-700">{task.id}</TableCell>
            <TableCell className="min-w-[320px]">
              <div className="space-y-1 whitespace-normal">
                <div className="text-sm leading-5 font-medium text-slate-900">{task.title}</div>
                {task.createdAt && (
                  <div className="text-xs leading-4 text-slate-500">
                    Создана: {formatDateTime(task.createdAt)}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="align-top">
              <div className="space-y-1">
                <div className="font-medium text-slate-900">{getTaskAuthorLabel(task, users)}</div>
                <div className="text-xs text-slate-500">{getTaskAuthorMeta(task, users)}</div>
              </div>
            </TableCell>
            <TableCell className="align-top text-slate-700">
              <div className="space-y-1">
                <div>{getScopeLabel(task.scope ?? task.region)}</div>
                {task.scope === 'regional' && task.taskRegion && (
                  <div className="text-xs text-slate-500">{task.taskRegion.name}</div>
                )}
              </div>
            </TableCell>
            <TableCell className="align-top text-slate-700">{getTaskTypeLabel(task.taskType ?? task.type)}</TableCell>
            <TableCell className="align-top text-slate-700">
              <div className="space-y-1">
                <div>{task.deadlineLabel}</div>
                {getTaskActivationDate(task) && (
                  <div className="text-xs leading-4 text-slate-500">
                    Активация: {formatDateTime(getTaskActivationDate(task))}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="align-top">
              <Badge className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${getStatusClassName(task.status)}`}>
                  {task.statusLabel ?? getStatusLabel(task.status)}
                </Badge>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );
});

function InfiniteAuthorSearchSelect({
  label,
  value,
  placeholder,
  searchPlaceholder,
  fallbackUsers,
  onChange,
}: {
  label?: string;
  value?: string;
  placeholder: string;
  searchPlaceholder: string;
  fallbackUsers: UserListItem[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 500);
  const usersQuery = useInfiniteQuery({
    queryKey: ['task-author-filter-users', debouncedQuery.trim()],
    queryFn: ({ pageParam }) =>
      getUsersPage({ search: debouncedQuery.trim(), statuses: 'active' }, Number(pageParam), AUTHOR_FILTER_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: open,
  });
  const options = useMemo(
    () =>
      usersQuery.data?.pages.flatMap((page) =>
        page.items.map((user) => ({
          value: String(user.id),
          label: user.fullName,
          description: `@${user.username}`,
        })),
      ) ?? [],
    [usersQuery.data],
  );
  const selectedOption =
    options.find((option) => option.value === value) ??
    fallbackUsers
      .map((user) => ({
        value: String(user.id),
        label: user.fullName,
        description: `@${user.username}`,
      }))
      .find((option) => option.value === value);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (!usersQuery.hasNextPage || usersQuery.isFetchingNextPage) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    if (scrollHeight - scrollTop - clientHeight < 48) {
      void usersQuery.fetchNextPage();
    }
  }

  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"
          >
            <span className="min-w-0 truncate">{selectedOption?.label.trim() ?? placeholder}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(420px,calc(100vw-3rem))] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 border-slate-200 pl-9 text-sm"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-3 h-64 overflow-y-auto rounded-md border border-slate-200" onScroll={handleScroll}>
            <div className="p-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => handleSelect('')}
              >
                <Check
                  className={cn('size-4 text-[#465cd3]', !value ? 'opacity-100' : 'opacity-0')}
                />
                <span className="font-medium text-slate-900">{placeholder}</span>
              </button>

              {usersQuery.isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Загружаем список...
                </div>
              ) : options.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Ничего не найдено.
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 text-[#465cd3]',
                        value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="font-medium text-slate-900">{option.label}</span>
                      {option.description && (
                        <span className="block text-xs text-slate-500">{option.description}</span>
                      )}
                    </span>
                  </button>
                ))
              )}
              {usersQuery.isFetchingNextPage && (
                <div className="px-3 py-3 text-center text-sm text-slate-500">
                  Загружаем еще...
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function HeaderSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? '' : nextValue)}>
      <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-sm font-normal">
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
  );
}

function HeaderSearchInput({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value ?? '');

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (inputValue === (value ?? '')) {
      return;
    }

    const timeoutId = window.setTimeout(() => onChange(inputValue), 500);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, onChange, value]);

  return (
    <Input
      className="h-9 border-slate-200 bg-white text-sm font-normal"
      value={inputValue}
      placeholder={placeholder}
      onChange={(event) => setInputValue(event.target.value)}
    />
  );
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function getTaskAuthorLabel(task: Task, users: UserListItem[]) {
  const author = users.find((user) => user.id === task.createdByUserId);

  if (author) {
    return author.fullName;
  }

  return task.createdByUserId ? `#${task.createdByUserId}` : 'n/a';
}

function getTaskAuthorMeta(task: Task, users: UserListItem[]) {
  const author = users.find((user) => user.id === task.createdByUserId);

  if (author?.username) {
    return `@${author.username}`;
  }

  return task.createdByUserId ? `Автор #${task.createdByUserId}` : 'n/a';
}

function getTaskActivationDate(task: Task) {
  if (task.scheduledAt) {
    return task.scheduledAt;
  }

  return task.status === 'active' ? task.createdAt : null;
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
