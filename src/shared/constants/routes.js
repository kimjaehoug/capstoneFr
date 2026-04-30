export const LOGIN_ROUTE = '/login';
export const WORKSPACE_ROUTE = '/workspace';
export const SHARED_HUB_ROUTE = '/hub/shared';
export const OPS_CONSOLE_ROUTE = '/console/ops';
export const TOP_LEVEL_ROUTES = [WORKSPACE_ROUTE, SHARED_HUB_ROUTE, OPS_CONSOLE_ROUTE];

export function normalizeAppPath(path) {
  if (TOP_LEVEL_ROUTES.some((route) => path.startsWith(route))) return path;
  if (path === LOGIN_ROUTE) return LOGIN_ROUTE;
  return WORKSPACE_ROUTE;
}
