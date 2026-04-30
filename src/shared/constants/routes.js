export const TOP_LEVEL_ROUTES = ['/workspace', '/hub/shared', '/console/ops'];
export const LOGIN_ROUTE = '/login';
export const WORKSPACE_ROUTE = '/workspace';

export function normalizeAppPath(path) {
  if (TOP_LEVEL_ROUTES.some((route) => path.startsWith(route))) return path;
  if (path === LOGIN_ROUTE) return LOGIN_ROUTE;
  return WORKSPACE_ROUTE;
}
