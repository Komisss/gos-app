import { http } from '@/shared/api/http';
import type { Task, TaskDto, TaskPayload } from '@/entities/task/model/types';

const TASKS_ENDPOINT = '/api/v1/tasks';

type TasksResponse =
  | TaskDto[]
  | {
      results?: TaskDto[];
      items?: TaskDto[];
      data?: TaskDto[];
    };

export async function getTasks() {
  const response = await http<TasksResponse>(TASKS_ENDPOINT);

  return normalizeTasksResponse(response).map(mapTaskDtoToTask);
}

export async function createTask(payload: TaskPayload) {
  const response = await http<TaskDto>(TASKS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return mapTaskDtoToTask(response);
}

export async function updateTask(taskId: number, payload: Partial<TaskPayload>) {
  const response = await http<TaskDto>(`${TASKS_ENDPOINT}/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return mapTaskDtoToTask(response);
}

export async function archiveTask(taskId: number) {
  await http<void>(`${TASKS_ENDPOINT}/${taskId}/archive`, {
    method: 'POST',
  });
}

export function mapTaskDtoToTask(task: TaskDto): Task {
  return {
    id: task.task_id,
    taskId: task.task_id,
    title: task.title,
    subtitle: `Создана: ${formatDateTime(task.created_at)}`,
    type: task.task_type,
    scope: task.scope,
    taskType: task.task_type,
    reportFormat: task.report_format,
    region: getScopeLabel(task.scope),
    assignee: `Автор #${task.created_by_user_id}`,
    activityStart: `Создана: ${formatDateTime(task.created_at)}`,
    activityEnd: `Дедлайн: ${formatDateTime(task.deadline_at)}`,
    status: task.status,
    statusLabel: getStatusLabel(task.status),
    deadlineLabel: formatDateTime(task.deadline_at),
    deadlineAt: task.deadline_at,
    createdAt: task.created_at,
    createdByUserId: task.created_by_user_id,
    answerFormat: `Формат отчета: ${getReportFormatLabel(task.report_format)}`,
  };
}

function normalizeTasksResponse(response: TasksResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  return response.results ?? response.items ?? response.data ?? [];
}

export function getScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    federal: 'Федеральная',
    regional: 'Региональная',
    municipal: 'Муниципальная',
  };

  return labels[scope] ?? scope;
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активная',
    pending: 'В работе',
    completed: 'Завершена',
    archived: 'В архиве',
  };

  return labels[status] ?? status;
}

export function getTaskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    online_action: 'Онлайн',
    street_action: 'Уличная',
  };

  return labels[type] ?? type;
}

export function getReportFormatLabel(format: string) {
  const labels: Record<string, string> = {
    link: 'Ссылка',
    image: 'Изображение',
  };

  return labels[format] ?? format;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
