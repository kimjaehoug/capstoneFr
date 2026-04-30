export const WORKSPACE_STEP_DATA = 'data';
export const WORKSPACE_STEP_PIPELINE = 'pipeline';
export const WORKSPACE_STEP_EXECUTION = 'execution';
export const WORKSPACE_STEP_REPORT = 'report';
export const WORKSPACE_STEPS = [
  WORKSPACE_STEP_DATA,
  WORKSPACE_STEP_PIPELINE,
  WORKSPACE_STEP_EXECUTION,
  WORKSPACE_STEP_REPORT,
];

export function isWorkspaceStep(value) {
  return WORKSPACE_STEPS.includes(value);
}
