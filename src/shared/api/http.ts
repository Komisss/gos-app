import { clearSession } from '@/features/auth/model/tokenStorage';
import { makeApiUrl, refreshAccessToken } from '@/shared/api/auth';

type HttpOptions = RequestInit & {
  auth?: boolean;
};

export async function http<T>(url: string, options: HttpOptions = {}): Promise<T> {
  const response = await requestWithCookies(url, options);

  if (response.status === 401 && options.auth !== false) {
    try {
      await refreshAccessToken();
      const retryResponse = await requestWithCookies(url, options);

      return parseResponse<T>(retryResponse);
    } catch (error) {
      clearSession();
      throw error;
    }
  }

  return parseResponse<T>(response);
}

async function requestWithCookies(url: string, options: HttpOptions) {
  const { auth: _auth, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && requestOptions.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(makeApiUrl(url), {
    ...requestOptions,
    credentials: 'include',
    headers: requestHeaders,
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get('Content-Length');
  const contentType = response.headers.get('Content-Type');

  if (contentLength === '0' || !contentType?.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
