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

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 500) {
      return error.message;
    }

    return `Ошибка ${error.status}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getApiErrorDescription(error: unknown) {
  if (!(error instanceof ApiError) || error.details === undefined || error.status === 500) {
    return undefined;
  }

  if (typeof error.details === 'string') {
    return error.details;
  }

  return JSON.stringify(error.details, null, 2);
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
