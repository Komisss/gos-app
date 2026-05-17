import { clearSession } from '@/features/auth/model/tokenStorage';
import { makeApiUrl, refreshAccessToken } from '@/shared/api/auth';
import { ApiError, extractApiErrorMessage } from '@/shared/lib/apiError';
import { showErrorToast } from '@/shared/lib/showErrorToast';

type HttpOptions = RequestInit & {
  auth?: boolean;
  responseType?: 'json' | 'blob';
};

export async function http<T>(url: string, options: HttpOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await requestWithCookies(url, options);
  } catch (error) {
    showErrorToast(error);
    throw error;
  }

  if (response.status === 401 && options.auth !== false) {
    try {
      await refreshAccessToken();
      const retryResponse = await requestWithCookies(url, options);

      return parseResponse<T>(retryResponse, options.responseType);
    } catch (error) {
      clearSession();
      showErrorToast(error);
      throw error;
    }
  }

  try {
    return await parseResponse<T>(response, options.responseType);
  } catch (error) {
    showErrorToast(error);
    throw error;
  }
}

async function requestWithCookies(url: string, options: HttpOptions) {
  const { auth: _auth, responseType: _responseType, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && requestOptions.body && !(requestOptions.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(makeApiUrl(url), {
    ...requestOptions,
    credentials: 'include',
    headers: requestHeaders,
  });
}

async function parseResponse<T>(response: Response, responseType: HttpOptions['responseType'] = 'json'): Promise<T> {
  if (!response.ok) {
    const details = await parseErrorResponse(response);
    throw new ApiError({
      status: response.status,
      message: extractApiErrorMessage(details, response.statusText || 'Request failed'),
      details,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === 'blob' || response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats-officedocument')) {
    return response.blob() as Promise<T>;
  }

  const contentLength = response.headers.get('Content-Length');
  const contentType = response.headers.get('Content-Type');

  if (contentLength === '0' || !contentType?.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function parseErrorResponse(response: Response) {
  const contentType = response.headers.get('Content-Type');

  if (contentType?.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
