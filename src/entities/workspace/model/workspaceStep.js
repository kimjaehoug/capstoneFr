export const WORKSPACE_STEP_DATA = 'data';
export const WORKSPACE_STEP_PIPELINE = 'pipeline';
export const WORKSPACE_STEP_MODULE = 'module';
export const WORKSPACE_STEP_RESULT = 'result';
export const WORKSPACE_STEPS = [
  WORKSPACE_STEP_DATA,
  WORKSPACE_STEP_PIPELINE,
  WORKSPACE_STEP_MODULE,
  WORKSPACE_STEP_RESULT,
];

export function isWorkspaceStep(value) {
  return WORKSPACE_STEPS.includes(value);
}
