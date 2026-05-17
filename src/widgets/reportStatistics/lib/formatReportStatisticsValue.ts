const orgUnitStatusLabels: Record<string, string> = {
  active: 'Активная',
  inactive: 'Неактивная',
  deactivated: 'Неактивная',
};

const userStatusLabels: Record<string, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
  deactivated: 'Неактивный',
};

const taskScopeLabels: Record<string, string> = {
  federal: 'Федеральный',
  regional: 'Региональный',
};

const taskTypeLabels: Record<string, string> = {
  online_action: 'Онлайн-акция',
  street_action: 'Уличная акция',
};

const taskStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирована',
  active: 'Активная',
  inactive: 'Неактивная',
  completed: 'Завершена',
  archived: 'Архивная',
};

const reportTypeLabels: Record<string, string> = {
  link: 'Ссылка',
  image: 'Изображение',
};

const reportStatusLabels: Record<string, string> = {
  pending: 'На проверке',
  under_review: 'На проверке',
  accepted: 'Принято',
  revision_requested: 'На доработке',
  not_completed: 'Не выполнено',
};

const assignmentStatusLabels: Record<string, string> = {
  assigned: 'Назначено',
  in_progress: 'В работе',
  pending: 'На проверке',
  under_review: 'На проверке',
  revision_requested: 'На доработке',
  accepted: 'Принято',
  not_completed: 'Не выполнено',
  deactivated_not_completed: 'Не выполнено из-за деактивации',
};

const moderationActionLabels: Record<string, string> = {
  accepted: 'Принято',
  revision_requested: 'Возврат на доработку',
};

function formatDictionaryValue(value: unknown, dictionary: Record<string, string>) {
  if (typeof value !== 'string') {
    return null;
  }

  return dictionary[value] ?? value;
}

export function formatOrgUnitStatus(value: unknown) {
  return formatDictionaryValue(value, orgUnitStatusLabels);
}

export function formatUserStatus(value: unknown) {
  return formatDictionaryValue(value, userStatusLabels);
}

export function formatTaskScope(value: unknown) {
  return formatDictionaryValue(value, taskScopeLabels);
}

export function formatTaskType(value: unknown) {
  return formatDictionaryValue(value, taskTypeLabels);
}

export function formatTaskStatus(value: unknown) {
  return formatDictionaryValue(value, taskStatusLabels);
}

export function formatReportType(value: unknown) {
  return formatDictionaryValue(value, reportTypeLabels);
}

export function formatReportStatus(value: unknown) {
  return formatDictionaryValue(value, reportStatusLabels);
}

export function formatAssignmentStatus(value: unknown) {
  return formatDictionaryValue(value, assignmentStatusLabels);
}

export function formatModerationAction(value: unknown) {
  return formatDictionaryValue(value, moderationActionLabels);
}
