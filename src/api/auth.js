import { requestJson } from './client';

export async function signup(input) {
  return requestJson('/api/v1/auth/signup', {
    method: 'POST',
    body: {
      name: input.name,
      loginId: input.loginId,
      password: input.password,
    },
  });
}

export async function login(input) {
  return requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: {
      loginId: input.loginId,
      password: input.password,
    },
  });
}

export async function logoutApi() {
  return requestJson('/api/v1/auth/logout', {
    method: 'POST',
    skipUnauthorizedHandler: true,
  });
}

export async function fetchMe(accessToken) {
  return requestJson('/api/v1/auth/me', {
    method: 'GET',
    accessToken,
  });
}
