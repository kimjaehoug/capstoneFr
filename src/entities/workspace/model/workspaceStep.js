export const WORKSPACE_STEPS = ['data', 'pipeline', 'module', 'result'];

export function isWorkspaceStep(value) {
  return WORKSPACE_STEPS.includes(value);
}
