export const API_BASE_URL = import.meta.env.DEV ? '' : 'http://192.168.32.247:8001';

export type AuthTokenRequest = {
  username: string;
  password: string;
};

export type AuthUserRole = {
  id: number;
  code: string;
  name: string;
};

export type AuthTokenResponse = {
  detail: string;
  user_id: number;
  username: string;
  full_name: string;
  role: AuthUserRole | null;
};

const TOKEN_ENDPOINT = '/api/token';
const REFRESH_ENDPOINT = '/api/token/refresh';

export function makeApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function requestAuthTokens(payload: AuthTokenRequest): Promise<AuthTokenResponse> {
  const response = await fetch(makeApiUrl(TOKEN_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(response.status));
  }

  return response.json();
}

export async function refreshAccessToken(): Promise<void> {
  const response = await fetch(makeApiUrl(REFRESH_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Не удалось обновить сессию');
  }
}

function getAuthErrorMessage(status: number) {
  if (status === 400 || status === 401) {
    return 'Неверный логин или пароль';
  }

  return 'Не удалось выполнить вход. Попробуйте позже';
}
