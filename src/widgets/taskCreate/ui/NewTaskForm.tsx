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
  short_description: null,
  full_description: null,
  revision_limit: null,
  comment_for_executor: null,
  scope: 'regional',
  status: 'draft',
  task_type: 'online_action',
  report_format: 'link',
  deadline_at: null,
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
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-6 py-6">
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

          <Field label="Короткое описание">
            <Input
              placeholder="Введите короткое описание"
              className="border-slate-200"
              value={form.short_description ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, short_description: event.target.value }))
              }
            />
          </Field>

          <Field label="Полное описание">
            <textarea
              className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Введите полное описание"
              value={form.full_description ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, full_description: event.target.value }))
              }
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Количество правок задачи">
              <Input
                type="number"
                min={0}
                max={9}
                className="border-slate-200"
                value={form.revision_limit ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    revision_limit: normalizeRevisionLimit(event.target.value),
                  }))
                }
              />
            </Field>

            <Field label="Комментарий для исполнителя">
              <Input
                placeholder="Введите комментарий"
                className="border-slate-200"
                value={form.comment_for_executor ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, comment_for_executor: event.target.value }))
                }
              />
            </Field>
          </div>

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
            <Field label="Масштаб">
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
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="scheduled">Запланирована</SelectItem>
                  <SelectItem value="active">Активная</SelectItem>
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
              disabled={createMutation.isPending || (form.status !== 'draft' && !assignmentTarget)}
            >
              {createMutation.isPending
                ? 'Создание...'
                : form.status === 'draft'
                  ? 'Создать задачу'
                  : 'Создать и назначить исполнителей'}
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
    short_description: normalizeOptionalString(form.short_description),
    full_description: normalizeOptionalString(form.full_description),
    comment_for_executor: normalizeOptionalString(form.comment_for_executor),
    revision_limit: clampRevisionLimit(form.revision_limit),
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

function normalizeRevisionLimit(value: string) {
  if (value === '') {
    return null;
  }

  return clampRevisionLimit(Number(value));
}

function clampRevisionLimit(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.min(Math.max(0, value), 9);
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
