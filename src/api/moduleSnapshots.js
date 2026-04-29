import { requestJson } from './client';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export async function listModuleSnapshots(pipelineId, { userId } = {}) {
  return requestJson(
    `/api/v1/pipelines/${pipelineId}/module-snapshots${toQuery({ userId })}`,
    { method: 'GET' },
  );
}

export async function getModuleSnapshot(pipelineId, moduleId, { userId } = {}) {
  return requestJson(
    `/api/v1/pipelines/${pipelineId}/module-snapshots/${moduleId}${toQuery({ userId })}`,
    { method: 'GET' },
  );
}

export async function saveModuleSnapshot(pipelineId, moduleId, input) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/module-snapshots/${moduleId}`, {
    method: 'PUT',
    body: input,
  });
}
