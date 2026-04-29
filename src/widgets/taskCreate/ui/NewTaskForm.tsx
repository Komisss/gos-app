import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { createTask } from '@/entities/task/api/tasks';
import type { TaskPayload, TaskScope } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';

type AssignmentTarget =
  | {
      kind: 'scope';
      scope: Extract<TaskScope, 'federal' | 'regional'>;
    }
  | {
      kind: 'user';
      userId: number;
    };

const initialForm: TaskPayload = {
  title: '',
  scope: 'federal',
  status: 'draft',
  task_type: 'online_action',
  report_format: 'link',
  deadline_at: new Date().toISOString(),
};

export function NewTaskForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaskPayload>(initialForm);
  const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget>({
    kind: 'scope',
    scope: 'federal',
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  function handleAssignmentChange(target: AssignmentTarget, user?: UserListItem) {
    setAssignmentTarget(target);

    if (target.kind === 'scope') {
      setForm((current) => {
        const { assigned_user_id: _assignedUserId, ...rest } = current;

        return { ...rest, scope: target.scope };
      });
      return;
    }

    setForm((current) => ({
      ...current,
      scope: user?.region ? 'regional' : 'federal',
      assigned_user_id: target.userId,
    }));
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новая задача</h1>
          <p className="text-sm text-slate-500">
            Заполните поля, которые принимает API создания задачи.
          </p>
        </div>

        <form
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <Field label="Название задачи">
            <Input
              placeholder="Введите название задачи"
              className="border-slate-200"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </Field>

          <Field label="Адресат задачи">
            <AssignmentCombobox
              users={usersQuery.data ?? []}
              isLoading={usersQuery.isLoading}
              value={assignmentTarget}
              onChange={handleAssignmentChange}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Статус">
              <Select
                value={form.status}
                onValueChange={(status) => setForm((current) => ({ ...current, status }))}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="active">Активная</SelectItem>
                  <SelectItem value="pending">В работе</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Тип задачи">
              <Select
                value={form.task_type}
                onValueChange={(task_type) => setForm((current) => ({ ...current, task_type }))}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="online_action">Онлайн-акция</SelectItem>
                  <SelectItem value="street_action">Уличная акция</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Формат отчета">
              <Select
                value={form.report_format}
                onValueChange={(report_format) =>
                  setForm((current) => ({ ...current, report_format }))
                }
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="link">Ссылка</SelectItem>
                  <SelectItem value="image">Изображение</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Дедлайн">
              <Input
                type="datetime-local"
                className="border-slate-200"
                value={toDateTimeLocalValue(form.deadline_at)}
                onChange={(event) => {
                  if (!event.target.value) {
                    setForm((current) => ({ ...current, deadline_at: '' }));
                    return;
                  }

                  setForm((current) => ({
                    ...current,
                    deadline_at: new Date(event.target.value).toISOString(),
                  }));
                }}
                required
              />
            </Field>
          </div>

          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось создать задачу.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/tasks">К списку задач</Link>
            </Button>
            <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать задачу'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignmentCombobox({
  users,
  isLoading,
  value,
  onChange,
}: {
  users: UserListItem[];
  isLoading: boolean;
  value: AssignmentTarget;
  onChange: (target: AssignmentTarget, user?: UserListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedUser = value.kind === 'user' ? users.find((user) => user.id === value.userId) : null;
  const selectedLabel =
    value.kind === 'user'
      ? selectedUser
        ? `${selectedUser.fullName} (@${selectedUser.username})`
        : `Пользователь #${value.userId}`
      : value.scope === 'federal'
        ? 'Федеральная задача'
        : 'Региональная задача';

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) =>
      `${user.fullName} ${user.username} ${user.role?.name ?? ''} ${user.region?.name ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between border-slate-200 bg-white text-left font-normal"
        >
          <span className="min-w-0 truncate">{selectedLabel}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(520px,calc(100vw-3rem))] gap-4 p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Тип адресата</p>
          <Select
            value={value.kind === 'scope' ? value.scope : ''}
            onValueChange={(scope) =>
              onChange({ kind: 'scope', scope: scope as Extract<TaskScope, 'federal' | 'regional'> })
            }
          >
            <SelectTrigger className="w-full border-slate-200 bg-white">
              <SelectValue placeholder="Выберите уровень задачи" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="regional">Региональный</SelectItem>
              <SelectItem value="federal">Федеральный</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Или конкретный пользователь</p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 border-slate-200 pl-9"
              placeholder="Поиск по ФИО, логину, роли или региону"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <ScrollArea className="h-56 rounded-md border border-slate-200">
            <div className="p-1">
              {isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Загружаем пользователей...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Пользователи не найдены.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => {
                      onChange({ kind: 'user', userId: user.id }, user);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 text-[#465cd3]',
                        value.kind === 'user' && value.userId === user.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{user.fullName}</span>
                      <span className="block text-xs text-slate-500">
                        @{user.username}
                        {user.region?.name ? ` • ${user.region.name}` : ''}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}
