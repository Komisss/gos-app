import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import type { Task, TaskPayload, TaskTargetPayload, TaskTargetType } from '@/entities/task/model/types';
import { getUsers } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { toApiDateTime } from '@/shared/lib/dateTime';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type Props = {
  task: Task | null;
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskId: number, payload: TaskPayload) => void;
};

export function TaskEditDialog({ task, open, isSubmitting, onOpenChange, onSubmit }: Props) {
  const [form, setForm] = useState<TaskPayload>(() => getInitialForm(task));

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    enabled: open,
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
    enabled: open,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
    enabled: open,
  });

  useEffect(() => {
    setForm(getInitialForm(task));
  }, [task]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    onSubmit(task.id, normalizeTaskPayload(form));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[720px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-950">Редактирование задачи</DialogTitle>
          <DialogDescription>Введите данные для изменения задачи.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Название">
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </Field>


          <Field label="Описание">
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={form.full_description ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, full_description: event.target.value }))}
            />
          </Field>

          <Field label="Адресат задачи">
            <AssignmentCombobox
              users={usersQuery.data ?? []}
              regions={regionsQuery.data ?? []}
              orgUnits={orgUnitsQuery.data ?? []}
              isLoading={usersQuery.isLoading || regionsQuery.isLoading || orgUnitsQuery.isLoading}
              value={getAssignmentTarget(form.targets)}
              onChange={(target) =>
                setForm((current) => ({
                  ...current,
                  targets: target ? [{ target_type: target.kind, target_id: target.ids }] : null,
                }))
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Уровень">
              <Select
                value={form.scope}
                onValueChange={(scope) => setForm((current) => ({ ...current, scope }))}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                        : null,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Запланирована</SelectItem>
                  <SelectItem value="active">Активная</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Тип задачи">
              <Select
                value={form.task_type}
                onValueChange={(task_type) =>
                  setForm((current) => ({
                    ...current,
                    task_type,
                    report_format:
                      task_type === 'street_action' ||
                      (task_type === 'online_action' && (current.online_task_subtype ?? 'like') === 'like')
                        ? 'image'
                        : current.report_format,
                    online_task_subtype:
                      task_type === 'online_action' ? (current.online_task_subtype ?? 'like') : undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online_action">Онлайн-акция</SelectItem>
                  <SelectItem value="street_action">Уличная акция</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {form.task_type === 'online_action' && (
              <Field label="Подтип задачи">
                <Select
                  value={form.online_task_subtype ?? 'like'}
                  onValueChange={(online_task_subtype) =>
                    setForm((current) => ({
                      ...current,
                      online_task_subtype: online_task_subtype as TaskPayload['online_task_subtype'],
                      report_format: online_task_subtype === 'like' ? 'image' : current.report_format,
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like">Лайк</SelectItem>
                    <SelectItem value="comment">Комментарий</SelectItem>
                    <SelectItem value="repost">Репост</SelectItem>
                    <SelectItem value="post">Пост</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Формат отчета">
              <Select
                value={form.report_format}
                disabled={isReportFormatLocked(form)}
                onValueChange={(report_format) =>
                  setForm((current) => ({ ...current, report_format }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Ссылка</SelectItem>
                  <SelectItem value="image">Изображение</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Дедлайн">
              <DateTimePicker
                value={form.deadline_at ?? undefined}
                onChange={(deadline_at) => setForm((current) => ({ ...current, deadline_at }))}
                placeholder="Выберите дедлайн"
              />
            </Field>

          {form.status === 'scheduled' && (
            <Field label="Время активации задачи">
              <DateTimePicker
                value={form.scheduled_at ?? undefined}
                onChange={(scheduled_at) => setForm((current) => ({ ...current, scheduled_at }))}
                placeholder="Выберите дату и время активации"
                minDate={new Date()}
              />
            </Field>
          )}


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type AssignmentTarget = {
  kind: TaskTargetType;
  ids: number[];
} | null;

type AssignmentOption = {
  id: number;
  kind: TaskTargetType;
  label: string;
  description?: string;
};

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
  const [kind, setKind] = useState<TaskTargetType>(value?.kind ?? 'region');
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

    onChange(nextIds.length > 0 ? { kind: item.kind, ids: nextIds } : null);
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
              const typedKind = nextKind as TaskTargetType;
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

function useAssignmentList(
  kind: TaskTargetType,
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
  kind: TaskTargetType,
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

function getAssignmentTarget(targets?: TaskTargetPayload[] | null): AssignmentTarget {
  const firstTarget = targets?.find((target) => target.target_id.length > 0);

  return firstTarget ? { kind: firstTarget.target_type, ids: firstTarget.target_id } : null;
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

function getSearchLabel(kind: TaskTargetType) {
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
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {children}
    </div>
  );
}

function getInitialForm(task: Task | null): TaskPayload {
  return {
    title: task?.title ?? '',
    full_description: task?.fullDescription ?? task?.description ?? null,
    scope: task?.scope === 'federal' ? 'federal' : 'regional',
    status: task?.status === 'scheduled' ? 'scheduled' : 'active',
    task_type: task?.taskType ?? 'online_action',
    online_task_subtype: task?.taskType === 'online_action' ? (task.onlineTaskSubtype ?? 'like') : undefined,
    report_format: task?.reportFormat ?? 'link',
    deadline_at: task?.deadlineAt ?? null,
    scheduled_at: task?.scheduledAt ?? null,
    targets: mapTargetsToPayload(task),
  };
}

function normalizeTaskPayload(form: TaskPayload): TaskPayload {
  const now = new Date();
  const scheduledAt = form.scheduled_at ? new Date(form.scheduled_at) : now;
  const normalized: TaskPayload = {
    ...form,
    full_description: normalizeOptionalString(form.full_description),
    report_format: isReportFormatLocked(form) ? 'image' : form.report_format,
    online_task_subtype: form.task_type === 'online_action' ? form.online_task_subtype : undefined,
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

function isReportFormatLocked(form: TaskPayload) {
  return form.task_type === 'street_action' || form.online_task_subtype === 'like';
}

function mapTargetsToPayload(task: Task | null): TaskTargetPayload[] | undefined {
  if (!task?.targets?.length) {
    return undefined;
  }

  const groups = task.targets.reduce<Record<TaskTargetType, number[]>>(
    (acc, target) => {
      acc[target.target_type].push(target.target_id);
      return acc;
    },
    { region: [], org_unit: [], user: [] },
  );

  return Object.entries(groups)
    .filter(([, ids]) => ids.length > 0)
    .map(([target_type, target_id]) => ({
      target_type: target_type as TaskTargetType,
      target_id,
    }));
}
