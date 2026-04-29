const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);

let unauthorizedHandler = null;

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.requestId = options.requestId ?? null;
    this.details = options.details ?? null;
    this.isTimeout = Boolean(options.isTimeout);
    this.isNetworkError = Boolean(options.isNetworkError);
  }
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787').replace(/\/+$/, '');
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export function isApiError(error) {
  return error instanceof ApiError;
}

export async function requestJson(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    accessToken,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    credentials = 'include',
    skipUnauthorizedHandler = false,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders = { ...headers };
  if (body !== undefined && !finalHeaders['content-type']) {
    finalHeaders['content-type'] = 'application/json';
  }
  if (accessToken && !finalHeaders.authorization) {
    finalHeaders.authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      credentials,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`요청 시간이 초과되었습니다. (${timeoutMs}ms)`, {
        isTimeout: true,
      });
    }
    throw new ApiError('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.', {
      isNetworkError: true,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const requestId = response.headers.get('x-request-id') || null;
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiError = new ApiError(
      payload?.message || `요청 실패 (HTTP ${response.status})`,
      {
        status: response.status,
        code: payload?.code ?? null,
        requestId,
        details: payload,
      },
    );

    if (import.meta.env.DEV) {
      console.error('[api:error]', {
        path,
        method,
        status: response.status,
        code: apiError.code,
        requestId,
        payload,
      });
    }

    if (response.status === 401 && !skipUnauthorizedHandler && unauthorizedHandler) {
      unauthorizedHandler(apiError);
    }

    throw apiError;
  }

  if (import.meta.env.DEV) {
    console.debug('[api:ok]', { path, method, requestId });
  }

  return payload;
}
