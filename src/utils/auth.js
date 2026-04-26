const AUTH_STORAGE_KEY = 'stage-one-auth';

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

export async function loginWithGoogleIdToken(idToken) {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

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
