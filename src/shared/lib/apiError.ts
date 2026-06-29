export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor({ message, status, details }: { message: string; status: number; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const apiErrorTitleByCode: Record<string, string> = {
  DEBUG_UPDATE_USER_ERROR: 'Ошибка обновления пользователя',
  EMPTY_NAME: 'Не заполнено имя',
  INVALID_FILE_FORMAT: 'Некорректный формат файла',
  FILE_REQUIRED: 'Файл обязателен',
  VALIDATION_ERROR: 'Ошибка валидации',
  PERMISSION_DENIED: 'Недостаточно прав',
  NOT_FOUND: 'Запись не найдена',
  ALREADY_EXISTS: 'Запись уже существует',
  DUPLICATE_VALUE: 'Дублирующееся значение',
  INVALID_CREDENTIALS: 'Некорректные учетные данные',
  TOKEN_EXPIRED: 'Сессия истекла',
  HTTP_400: 'Некорректный запрос',
  HTTP_401: 'Требуется авторизация',
  HTTP_403: 'Недостаточно прав',
  HTTP_404: 'Запись не найдена',
  HTTP_409: 'Конфликт данных',
  HTTP_422: 'Ошибка валидации',
  HTTP_500: 'Произошла непредвиденная ошибка',
};

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return formatApiErrorCode(extractApiErrorCode(error.details, error.status));
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getApiErrorDescription(error: unknown) {
  return undefined;
}

export function formatApiErrorCode(code: string) {
  return `${code}: ${apiErrorTitleByCode[code] ?? 'Неизвестная ошибка'}`;
}

export function extractApiErrorCode(payload: unknown, status?: number): string {
  const code = findApiErrorCode(payload);

  if (code) {
    return code;
  }

  return status ? `HTTP_${status}` : 'UNKNOWN_ERROR';
}

export function extractApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as Record<string, unknown>;
  const candidate = data.detail ?? data.message ?? data.error ?? data.title;

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (Array.isArray(candidate)) {
    return candidate.map((item) => extractApiErrorMessage(item, '')).filter(Boolean).join('; ') || fallback;
  }

  if (candidate && typeof candidate === 'object') {
    return JSON.stringify(candidate);
  }

  return fallback;
}

function findApiErrorCode(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return isApiErrorCode(payload) ? payload : null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const code = findApiErrorCode(item);

      if (code) {
        return code;
      }
    }

    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const directCandidate =
    data.code ??
    data.error_code ??
    data.errorCode ??
    data.error ??
    data.type ??
    data.detail ??
    data.message ??
    data.title;

  if (typeof directCandidate === 'string' && isApiErrorCode(directCandidate)) {
    return directCandidate;
  }

  if (directCandidate && typeof directCandidate === 'object') {
    const code = findApiErrorCode(directCandidate);

    if (code) {
      return code;
    }
  }

  const errors = data.errors;

  if (Array.isArray(errors)) {
    return findApiErrorCode(errors);
  }

  return null;
}

function isApiErrorCode(value: string) {
  return /^[A-Z][A-Z0-9_]*$/.test(value.trim());
}
