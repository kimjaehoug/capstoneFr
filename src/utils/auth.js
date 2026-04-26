const AUTH_STORAGE_KEY = 'stage-one-auth';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787').replace(/\/+$/, '');
}

export function loadAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthState(value) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

export function clearAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function requestJson(path, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`요청 시간이 초과되었습니다. (${API_TIMEOUT_MS}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `로그인 요청 실패 (HTTP ${response.status})`);
  }

  return payload;
}

export async function signupWithCredentials(input) {
  return requestJson('/api/v1/auth/signup', {
    name: input.name,
    loginId: input.loginId,
    password: input.password,
  });
}

export async function loginWithCredentials(input) {
  return requestJson('/api/v1/auth/login', {
    loginId: input.loginId,
    password: input.password,
  });
}

export async function logout() {
  try {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // network error during logout should not block local sign-out
  }
}
