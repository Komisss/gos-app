export const API_BASE_URL = 'http://192.168.32.247:8001';

export type AuthTokenRequest = {
  username: string;
  password: string;
};

const TOKEN_ENDPOINT = '/api/token/';
const REFRESH_ENDPOINT = '/api/token/refresh';
const AUTH_MOCK_ENABLED = import.meta.env.DEV;

export function makeApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function requestAuthTokens(payload: AuthTokenRequest): Promise<void> {
  if (AUTH_MOCK_ENABLED) {
    await mockAuthRequest(payload);
    return;
  }

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
}

export async function refreshAccessToken(): Promise<void> {
  if (AUTH_MOCK_ENABLED) {
    return;
  }

  const response = await fetch(makeApiUrl(REFRESH_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Не удалось обновить сессию');
  }
}

async function mockAuthRequest(payload: AuthTokenRequest) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (!payload.username.trim() || !payload.password) {
    throw new Error('Введите логин и пароль');
  }
}

function getAuthErrorMessage(status: number) {
  if (status === 400 || status === 401) {
    return 'Неверный логин или пароль';
  }

  return 'Не удалось выполнить вход. Попробуйте позже';
}
