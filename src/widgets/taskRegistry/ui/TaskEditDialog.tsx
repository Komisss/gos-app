import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Task, TaskPayload } from '@/entities/task/model/types';
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

type Props = {
  task: Task | null;
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskId: number, payload: TaskPayload) => void;
};

export function TaskEditDialog({ task, open, isSubmitting, onOpenChange, onSubmit }: Props) {
  const [form, setForm] = useState<TaskPayload>(() => getInitialForm(task));

  useEffect(() => {
    setForm(getInitialForm(task));
  }, [task]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    onSubmit(task.id, form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-950">Редактирование задачи</DialogTitle>
          <DialogDescription>Изменения будут отправлены методом PATCH.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Название">
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
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
                  <SelectItem value="federal">Федеральная</SelectItem>
                  <SelectItem value="regional">Региональная</SelectItem>
                  <SelectItem value="municipal">Муниципальная</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Статус">
              <Select
                value={form.status}
                onValueChange={(status) => setForm((current) => ({ ...current, status }))}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="active">Активная</SelectItem>
                  <SelectItem value="pending">В работе</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Тип задачи">
              <Select
                value={form.task_type}
                onValueChange={(task_type) => setForm((current) => ({ ...current, task_type }))}
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

            <Field label="Формат отчета">
              <Select
                value={form.report_format}
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
              value={form.deadline_at}
              onChange={(deadline_at) => setForm((current) => ({ ...current, deadline_at }))}
              placeholder="Выберите дедлайн"
            />
          </Field>

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
    scope: task?.scope ?? 'federal',
    status: task?.status ?? 'draft',
    task_type: task?.taskType ?? 'online_action',
    report_format: task?.reportFormat ?? 'link',
    deadline_at: task?.deadlineAt ?? '',
  };
}
