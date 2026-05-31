import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import { createTask, materializeTaskAssignments } from '@/entities/task/api/tasks';
import type { TaskPayload, TaskTargetType } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { toApiDateTime } from '@/shared/lib/dateTime';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type AssignmentKind = TaskTargetType;

type AssignmentTarget = {
  kind: AssignmentKind;
  ids: number[];
} | null;

const initialForm: TaskPayload = {
  title: '',
  full_description: null,
  scope: 'regional',
  status: 'active',
  task_type: 'online_action',
  online_task_subtype: 'like',
  report_format: 'link',
  deadline_at: null
};

export function NewTaskForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaskPayload>(initialForm);
  const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const createMutation = useMutation({
    mutationFn: async ({ payload, assignAfterCreate }: { payload: TaskPayload; assignAfterCreate: boolean }) => {
      const createdTask = await createTask(payload);

      if (assignAfterCreate) {
        await materializeTaskAssignments(createdTask.id);
      }

      return createdTask;
    },
    onSuccess: async (createdTask) => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate(`/tasks/${createdTask.id}`);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const shouldAssignAfterCreate = form.status === 'scheduled' || form.status === 'active';

    createMutation.mutate({
      payload: normalizeTaskPayload(form),
      assignAfterCreate: shouldAssignAfterCreate,
    });
  }

  function handleAssignmentChange(target: AssignmentTarget) {
    setAssignmentTarget(target);

    if (!target) {
      setForm((current) => {
        const { targets: _targets, ...rest } = current;
        return { ...rest, targets: null };
      });
      return;
    }

    setForm((current) => ({
      ...current,
      targets: [
        {
          target_type: target.kind,
          target_id: target.ids,
        },
      ],
    }));
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новая задача</h1>
          <p className="text-sm text-slate-500">
            Заполните поля задачи.
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


          <Field label="Описание">
            <textarea
              className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Введите полное описание"
              value={form.full_description ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, full_description: event.target.value }))
              }
            />
          </Field>

          <Field label="Адресат задачи">
            <AssignmentCombobox
              users={usersQuery.data ?? []}
              regions={regionsQuery.data ?? []}
              orgUnits={orgUnitsQuery.data ?? []}
              isLoading={usersQuery.isLoading || regionsQuery.isLoading || orgUnitsQuery.isLoading}
              value={assignmentTarget}
              onChange={handleAssignmentChange}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Уровень">
              <Select
                value={form.scope}
                onValueChange={(scope) => setForm((current) => ({ ...current, scope }))}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="federal">Федеральный</SelectItem>
                  <SelectItem value="regional">Региональный</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Статус">
              <Select
                value={form.status}
                onValueChange={(status) =>
                  setForm((current) => ({
                    ...current,
                    status,
                    scheduled_at:
                      status === 'scheduled'
                        ? current.scheduled_at || toApiDateTime(new Date())
                        : undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="scheduled">Запланирована</SelectItem>
                  <SelectItem value="active">Активная</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Тип задачи">
              <Select
                value={form.task_type}
                onValueChange={(task_type) =>
                  setForm((current) => ({
                    ...current,
                    task_type,
                    report_format: task_type === 'street_action' ? 'image' : current.report_format,
                    online_task_subtype:
                      task_type === 'online_action' ? (current.online_task_subtype ?? 'like') : undefined,
                  }))
                }
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
            {
              form.task_type === 'online_action' &&
              <Field label="Подтип задачи">
                <Select
                  value={form.online_task_subtype}
                  onValueChange={(online_task_subtype) => setForm((current) => ({ ...current, online_task_subtype }))}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="like">Лайк</SelectItem>
                    <SelectItem value="comment">Комментарий</SelectItem>
                    <SelectItem value="repost">Репост</SelectItem>
                    <SelectItem value="post">Пост</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            }
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Формат отчета">
              <Select
                value={form.report_format}
                disabled={form.task_type === 'street_action'}
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
              <DateTimePicker
                value={form.deadline_at ?? undefined}
                onChange={(deadline_at) => setForm((current) => ({ ...current, deadline_at }))}
                placeholder="Выберите дедлайн"
              />
            </Field>
          </div>

          {form.status === 'scheduled' && (
            <Field label="Время активации задачи">
              <DateTimePicker
                value={form.scheduled_at ?? undefined}
                onChange={(scheduled_at) => setForm((current) => ({ ...current, scheduled_at }))}
                placeholder="Выберите дату и время активации"
                minDateTime={new Date()}
              />
            </Field>
          )}

          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось создать задачу.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/tasks">К списку задач</Link>
            </Button>
            <Button
              type="submit"
              className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
              disabled={createMutation.isPending || !assignmentTarget}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать и назначить исполнителей'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function normalizeTaskPayload(form: TaskPayload): TaskPayload {
  const now = new Date();
  const scheduledAt = form.scheduled_at ? new Date(form.scheduled_at) : now;
  const normalized: TaskPayload = {
    ...form,
    full_description: normalizeOptionalString(form.full_description),
    deadline_at: form.deadline_at || null,
    scheduled_at: null,
  };
  const payload = form.targets?.length ? normalized : omitTargets(normalized);

  if (form.status !== 'scheduled') {
    return payload;
  }

  return {
    ...payload,
    scheduled_at: toApiDateTime(
      Number.isNaN(scheduledAt.getTime()) || scheduledAt < now ? now : scheduledAt,
    ),
  };
}

function normalizeOptionalString(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function omitTargets(payload: TaskPayload): TaskPayload {
  const { targets: _targets, ...rest } = payload;

  return rest;
}

function AssignmentCombobox({
  users,
  regions,
  orgUnits,
  isLoading,
  value,
  onChange,
}: {
  users: UserListItem[];
  regions: Region[];
  orgUnits: OrgUnit[];
  isLoading: boolean;
  value: AssignmentTarget;
  onChange: (target: AssignmentTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AssignmentKind>(value?.kind ?? 'region');
  const [query, setQuery] = useState('');

  const data = { users, regions, orgUnits };
  const selectedLabel = getAssignmentLabel(value, data);
  const selectedNames = getAssignmentNames(value, data);
  const list = useAssignmentList(kind, query, data);

  function handleSelect(item: AssignmentOption) {
    const currentIds = value?.kind === item.kind ? value.ids : [];
    const nextIds = currentIds.includes(item.id)
      ? currentIds.filter((id) => id !== item.id)
      : [...currentIds, item.id];
    const nextTarget = nextIds.length > 0 ? { kind: item.kind, ids: nextIds } : null;

    onChange(nextTarget);
  }

  return (
    <div className="space-y-2">
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
      <PopoverContent align="start" className="w-[min(560px,calc(100vw-3rem))] gap-4 p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Тип адресата</p>
          <Select
            value={kind}
            onValueChange={(nextKind) => {
              const typedKind = nextKind as AssignmentKind;
              setKind(typedKind);
              setQuery('');
              onChange(null);
            }}
          >
            <SelectTrigger className="w-full border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="region">Региональная</SelectItem>
              <SelectItem value="org_unit">Орг структура</SelectItem>
              <SelectItem value="user">Пользователь</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">{getSearchLabel(kind)}</p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 border-slate-200 pl-9"
              placeholder="Поиск по названию"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <ScrollArea className="h-64 rounded-md border border-slate-200">
            <div className="p-1">
              {isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Загружаем список...
                </div>
              ) : list.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Ничего не найдено.
                </div>
              ) : (
                list.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => handleSelect(item)}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 text-[#465cd3]',
                        value?.kind === item.kind && value.ids.includes(item.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{item.label}</span>
                      {item.description && (
                        <span className="block text-xs text-slate-500">{item.description}</span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
      </Popover>
      {selectedNames.length > 0 && (
        <p className="text-sm leading-6 text-slate-600">{selectedNames.join(', ')}</p>
      )}
    </div>
  );
}

type AssignmentOption = {
  id: number;
  kind: AssignmentKind;
  label: string;
  description?: string;
};

function useAssignmentList(
  kind: AssignmentKind,
  query: string,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return useMemo(() => {
    const items = getAssignmentOptions(kind, data);

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      `${item.label} ${item.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [data, kind, normalizedQuery]);
}

function getAssignmentOptions(
  kind: AssignmentKind,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
): AssignmentOption[] {
  if (kind === 'region') {
    return data.regions.map((region) => ({
      id: region.id,
      kind: 'region',
      label: region.name,
      description: region.code,
    }));
  }

  if (kind === 'org_unit') {
    return data.orgUnits.map((orgUnit) => ({
      id: orgUnit.id,
      kind: 'org_unit',
      label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
      description: orgUnit.regionId ? `Регион #${orgUnit.regionId}` : undefined,
    }));
  }

  return data.users.map((user) => ({
    id: user.id,
    kind: 'user',
    label: user.fullName,
    description: `@${user.username}${user.region?.name ? ` • ${user.region.name}` : ''}`,
  }));
}

function getAssignmentLabel(
  value: AssignmentTarget,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  if (!value) {
    return 'Выберите адресата задачи';
  }

  const options = getAssignmentOptions(value.kind, data).filter((item) => value.ids.includes(item.id));

  if (options.length === 1) {
    return options[0].label.trim();
  }

  if (options.length > 1) {
    return `Выбрано: ${options.length}`;
  }

  return 'Выберите адресата задачи';
}

function getAssignmentNames(
  value: AssignmentTarget,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  if (!value) {
    return [];
  }

  return getAssignmentOptions(value.kind, data)
    .filter((item) => value.ids.includes(item.id))
    .map((item) => item.label.trim());
}

function getSearchLabel(kind: AssignmentKind) {
  if (kind === 'region') {
    return 'Регион';
  }

  if (kind === 'org_unit') {
    return 'Орг структура';
  }

  return 'Пользователь';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}
