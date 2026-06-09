import { http } from '@/shared/api/http';
import { toApiDateTime } from '@/shared/lib/dateTime';
import type { Task, TaskDto, TaskPayload } from '@/entities/task/model/types';

const TASKS_ENDPOINT = '/api/v1/tasks';

export type TaskFilters = Partial<{
  title: string;
  task_type: string;
  created_by_user_id: string;
  created_from: string;
  created_to: string;
  deadline_at_from: string;
  deadline_at_to: string;
  org_unit: string;
  region_id: string;
  scope: string;
  status: string;
  page: string;
  size: string;
}>;

export type TasksPage = {
  items: Task[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type TasksResponse =
  | TaskDto[]
  | {
      results?: TaskDto[];
      items?: TaskDto[];
      data?: TaskDto[];
    };

type TasksPageResponse = {
  items?: TaskDto[];
  page?: number;
  size?: number;
  total_elements?: number;
  total_pages?: number;
};

type CreateTaskResponse = Partial<TaskDto> & {
  id?: number | string;
  task_id?: number | string;
};

export async function getTasks(filters: TaskFilters = {}) {
  const response = await http<TasksResponse>(`${TASKS_ENDPOINT}${buildQueryString(filters)}`);

  return normalizeTasksResponse(response).map(mapTaskDtoToTask);
}

export async function getTasksPage(filters: TaskFilters = {}, page = 1, size = 25): Promise<TasksPage> {
  const response = await http<TasksPageResponse>(
    `${TASKS_ENDPOINT}${buildQueryString({ ...filters, page: String(page), size: String(size) })}`,
  );

  const items = (response.items ?? []).map(mapTaskDtoToTask);

  return {
    items,
    page: response.page ?? page,
    size: response.size ?? size,
    totalElements: response.total_elements ?? items.length,
    totalPages: response.total_pages ?? 1,
  };
}

export async function getTaskById(taskId: number) {
  const response = await http<TaskDto>(`${TASKS_ENDPOINT}/${taskId}`);

  return mapTaskDtoToTask(response);
}

function buildQueryString(filters: TaskFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, normalizeDateTimeFilter(key, value));
  });

  const query = params.toString();

  return query ? `?${query}` : '';
}

function normalizeDateTimeFilter(key: string, value: string) {
  if (
    key !== 'created_from' &&
    key !== 'created_to' &&
    key !== 'deadline_at_from' &&
    key !== 'deadline_at_to'
  ) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : toApiDateTime(date);
}

export async function createTask(payload: TaskPayload) {
  const response = await http<CreateTaskResponse>(TASKS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const createdTaskId = Number(response.id ?? response.task_id);

  if (!Number.isFinite(createdTaskId)) {
    throw new Error('Task create response does not contain task id.');
  }

  return { id: createdTaskId };
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

export async function activateTask(taskId: number) {
  await http<void>(`${TASKS_ENDPOINT}/${taskId}/activate`, {
    method: 'POST',
  });
}

export async function deleteTask(taskId: number) {
  await http<void>(`${TASKS_ENDPOINT}/${taskId}`, {
    method: 'DELETE',
  });
}

export async function materializeTaskAssignments(taskId: number) {
  await http<void>(`${TASKS_ENDPOINT}/${taskId}/assignments/materialize`, {
    method: 'POST',
  });
}

export function mapTaskDtoToTask(task: TaskDto): Task {
  return {
    id: task.task_id,
    taskId: task.task_id,
    title: task.title,
    subtitle: `Создана: ${formatDateTime(task.created_at)}`,
    shortDescription: task.short_description,
    fullDescription: task.full_description,
    description: task.full_description ?? task.short_description,
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
    scheduledAt: task.scheduled_at,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    createdByUserId: task.created_by_user_id,
    createdByRole: task.created_by_role,
    revisionLimit: task.revision_limit,
    commentForExecutor: task.comment_for_executor,
    targets: task.targets,
    isMaterialized: task.is_materialized,
    assignmentsCount: task.assignments_count,
    notificationsCount: task.notifications_count,
    pendingNotificationsCount: task.pending_notifications_count,
    sentNotificationsCount: task.sent_notifications_count,
    failedNotificationsCount: task.failed_notifications_count,
    taskAssignmentIds: task.task_assignment_ids,
    taskAssignments: task.task_assignments,
    regionsStatistics: task.regions_statistics,
    taskReports: task.reports,
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
    scheduled: 'Запланирована',
    active: 'Активная',
    pending: 'В работе',
    completed: 'Завершена',
    archived: 'В архиве',
  };

  return labels[status] ?? status;
}

export function getTaskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    online_action: 'Онлайн-акция',
    street_action: 'Уличная акция',
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
