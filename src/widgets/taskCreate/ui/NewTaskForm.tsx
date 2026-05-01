import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import { createTask } from '@/entities/task/api/tasks';
import type { TaskPayload, TaskScope, TaskTargetType } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
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
  scope: 'regional',
  status: 'draft',
  task_type: 'online_action',
  report_format: 'link',
  deadline_at: '',
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

  function handleAssignmentChange(target: AssignmentTarget, scope: TaskScope) {
    setAssignmentTarget(target);

    if (!target) {
      setForm((current) => {
        const { targets: _targets, ...rest } = current;
        return { ...rest, scope };
      });
      return;
    }

    setForm((current) => ({
      ...current,
      scope,
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
              regions={regionsQuery.data ?? []}
              orgUnits={orgUnitsQuery.data ?? []}
              isLoading={usersQuery.isLoading || regionsQuery.isLoading || orgUnitsQuery.isLoading}
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
              <DateTimePicker
                value={form.deadline_at}
                onChange={(deadline_at) => setForm((current) => ({ ...current, deadline_at }))}
                placeholder="Выберите дедлайн"
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
            <Button
              className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
              disabled={createMutation.isPending || !assignmentTarget?.ids.length}
            >
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
  onChange: (target: AssignmentTarget, scope: TaskScope) => void;
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

    onChange(nextTarget, getSelectionScope(item.kind, nextIds, data));
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
              onChange(null, typedKind === 'region' ? 'regional' : 'federal');
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
  scope: TaskScope;
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
      scope: 'regional',
    }));
  }

  if (kind === 'org_unit') {
    return data.orgUnits.map((orgUnit) => ({
      id: orgUnit.id,
      kind: 'org_unit',
      label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
      description: orgUnit.regionId ? `Регион #${orgUnit.regionId}` : undefined,
      scope: orgUnit.regionId ? 'regional' : 'federal',
    }));
  }

  return data.users.map((user) => ({
    id: user.id,
    kind: 'user',
    label: user.fullName,
    description: `@${user.username}${user.region?.name ? ` • ${user.region.name}` : ''}`,
    scope: user.region ? 'regional' : 'federal',
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

function getSelectionScope(
  kind: AssignmentKind,
  ids: number[],
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
): TaskScope {
  const selectedOptions = getAssignmentOptions(kind, data).filter((item) => ids.includes(item.id));

  return selectedOptions.some((item) => item.scope === 'regional') ? 'regional' : 'federal';
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
