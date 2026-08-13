import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import type { Task, TaskPayload, TaskTargetPayload, TaskTargetType } from '@/entities/task/model/types';
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';
import { useAuth } from '@/features/auth/model/AuthContext';
import { toApiDateTime } from '@/shared/lib/dateTime';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  TaskAssignmentTargetCombobox,
  type AssignmentKind,
  type AssignmentTarget,
} from '@/widgets/taskAssignmentTarget/ui/TaskAssignmentTargetCombobox';

type Props = {
  task: Task | null;
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskId: number, payload: TaskPayload) => void;
};


export function TaskEditDialog({ task, open, isSubmitting, onOpenChange, onSubmit }: Props) {
  const { session } = useAuth();
  const isFederalManager = session?.role?.id === USER_ROLE_IDS.federalManager;
  const [form, setForm] = useState<TaskPayload>(() => getInitialForm(task));
  const [descriptionError, setDescriptionError] = useState(false);
  const [deadlineError, setDeadlineError] = useState(false);
  const [activationTimeError, setActivationTimeError] = useState(false);
  const [dateTimeOrderError, setDateTimeOrderError] = useState<string | null>(null);

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
    if (!open) {
      return;
    }

    setForm(getInitialForm(task));
    setDescriptionError(false);
    setDeadlineError(false);
    setActivationTimeError(false);
    setDateTimeOrderError(null);
  }, [open, task]);

  useEffect(() => {
    if (!isFederalManager && form.scope === 'federal') {
      setForm((current) => ({ ...current, scope: 'regional' }));
    }
  }, [form.scope, isFederalManager]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    const isDescriptionMissing = !form.full_description?.trim();
    const isDeadlineMissing = !form.deadline_at;
    const isActivationTimeMissing = form.status === 'scheduled' && !form.scheduled_at;
    const nextDateTimeOrderError =
      isDeadlineMissing || isActivationTimeMissing ? null : getTaskDateTimeOrderError(form);

    setDescriptionError(isDescriptionMissing);
    setDeadlineError(isDeadlineMissing);
    setActivationTimeError(isActivationTimeMissing);
    setDateTimeOrderError(nextDateTimeOrderError);

    if (isDescriptionMissing || isDeadlineMissing || isActivationTimeMissing || nextDateTimeOrderError) {
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
              onChange={(event) => {
                const fullDescription = event.target.value;
                setForm((current) => ({ ...current, full_description: fullDescription }));

                if (fullDescription.trim()) {
                  setDescriptionError(false);
                }
              }}
              required
            />
            {descriptionError && (
              <p className="text-sm text-red-600">Описание задачи обязательно.</p>
            )}
          </Field>

          <Field label="Адресат задачи">
            <TaskAssignmentTargetCombobox
              scope={form.scope}
              regions={regionsQuery.data ?? []}
              orgUnits={orgUnitsQuery.data ?? []}
              isLoading={regionsQuery.isLoading || orgUnitsQuery.isLoading}
              value={getAssignmentTarget(form.targets)}
              contentMode="dialog"
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
                onValueChange={(scope) =>
                  setForm((current) => ({
                    ...current,
                    scope,
                    targets:
                      scope === 'regional'
                        ? normalizeRegionalTargets(current.targets)
                        : current.targets,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isFederalManager && <SelectItem value="federal">Федеральный</SelectItem>}
                  <SelectItem value="regional">Региональный</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Статус">
              <Select
                value={form.status}
                onValueChange={(status) => {
                  if (status !== 'scheduled') {
                    setActivationTimeError(false);
                  }

                  setForm((current) => ({
                    ...current,
                    status,
                    scheduled_at:
                      status === 'scheduled'
                        ? current.scheduled_at || toApiDateTime(new Date())
                        : null,
                  }));
                }}
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
                onChange={(deadline_at) => {
                  setForm((current) => ({ ...current, deadline_at }));
                  setDateTimeOrderError(null);

                  if (deadline_at) {
                    setDeadlineError(false);
                  }
                }}
                placeholder="Выберите дедлайн"
              />
              {deadlineError && (
                <p className="text-sm text-red-600">Дедлайн задачи обязателен.</p>
              )}
              {dateTimeOrderError && <p className="text-sm text-red-600">{dateTimeOrderError}</p>}
            </Field>

          {form.status === 'scheduled' && (
            <Field label="Время активации задачи">
              <DateTimePicker
                value={form.scheduled_at ?? undefined}
                onChange={(scheduled_at) => {
                  setForm((current) => ({ ...current, scheduled_at }));
                  setDateTimeOrderError(null);

                  if (scheduled_at) {
                    setActivationTimeError(false);
                  }
                }}
                placeholder="Выберите дату и время активации"
                minDate={new Date()}
              />
              {activationTimeError && (
                <p className="text-sm text-red-600">Укажите время активации задачи.</p>
              )}
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

function getAssignmentTarget(targets?: TaskTargetPayload[] | null): AssignmentTarget {
  const firstTarget = targets?.find(
    (target) => target.target_type !== 'org_unit' && target.target_id.length > 0,
  );

  return firstTarget ? { kind: firstTarget.target_type as AssignmentKind, ids: firstTarget.target_id } : null;
}

function normalizeRegionalTargets(targets?: TaskTargetPayload[] | null) {
  if (!targets) {
    return targets;
  }

  return targets.map((target) =>
    target.target_type === 'region' && target.target_id.length > 1
      ? { ...target, target_id: [target.target_id[0]] }
      : target,
  );
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
    title: form.title.trim(),
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

function getTaskDateTimeOrderError(form: TaskPayload) {
  if (!form.deadline_at) {
    return null;
  }

  const deadlineAt = new Date(form.deadline_at);

  if (Number.isNaN(deadlineAt.getTime())) {
    return 'Некорректная дата дедлайна.';
  }

  const activationAt = form.status === 'scheduled' && form.scheduled_at
    ? new Date(form.scheduled_at)
    : new Date();

  if (Number.isNaN(activationAt.getTime())) {
    return 'Некорректное время активации задачи.';
  }

  if (deadlineAt < activationAt) {
    return form.status === 'scheduled'
      ? 'Дедлайн не может быть раньше времени активации задачи.'
      : 'Дедлайн активной задачи не может быть раньше текущего времени.';
  }

  return null;
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
