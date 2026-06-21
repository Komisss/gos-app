import { memo, useEffect, useState } from 'react';

import {
  getScopeLabel,
  getStatusLabel,
  getTaskTypeLabel,
  type TaskFilters,
} from '@/entities/task/api/tasks';
import type { Task } from '@/entities/task/model/types';
import type { UserListItem } from '@/entities/user/model/types';
import { Badge } from '@/shared/ui/badge';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

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
          <FilterSearchSelect
            label=""
            value={filters.created_by_user_id}
            placeholder="Все авторы"
            searchPlaceholder="Поиск по ФИО или логину"
            options={users.map((user) => ({
              value: String(user.id),
              label: user.fullName,
              description: `@${user.username}`,
            }))}
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
              { value: 'pending', label: 'В работе' },
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
            className={`cursor-pointer align-top border-b-slate-200 hover:bg-slate-50/60 ${
              index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
            }`}
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
