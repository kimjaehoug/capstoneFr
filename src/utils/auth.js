import { fetchMe, login, logoutApi, signup } from '../api/auth';
import { getApiBaseUrl, isApiError } from '../api/client';

const AUTH_STORAGE_KEY = 'stage-one-auth';

export { getApiBaseUrl };

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

export async function signupWithCredentials(input) {
  return signup(input);
}

export async function loginWithCredentials(input) {
  return login(input);
}

export async function getMyProfile(accessToken) {
  return fetchMe(accessToken);
}

export async function logout() {
  try {
    await logoutApi();
  } catch (error) {
    if (isApiError(error) && (error.isNetworkError || error.isTimeout)) {
      return;
    }
    return;
  }
}
