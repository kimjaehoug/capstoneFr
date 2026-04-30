import { requestJson } from '../../../api/client';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export async function listPipelineTemplates() {
  return requestJson('/api/v1/pipeline-templates', { method: 'GET' });
}

export async function copyPipelineTemplate(templateId, input = {}) {
  return requestJson(`/api/v1/pipeline-templates/${templateId}/copy`, {
    method: 'POST',
    body: input,
  });
}

export async function listPipelines({ userId } = {}) {
  return requestJson(`/api/v1/pipelines${toQuery({ userId })}`, { method: 'GET' });
}

export async function createPipeline(input) {
  return requestJson('/api/v1/pipelines', {
    method: 'POST',
    body: input,
  });
}

export async function getPipeline(pipelineId) {
  return requestJson(`/api/v1/pipelines/${pipelineId}`, { method: 'GET' });
}

export async function updatePipeline(pipelineId, patch) {
  return requestJson(`/api/v1/pipelines/${pipelineId}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function duplicatePipeline(pipelineId, input = {}) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/duplicate`, {
    method: 'POST',
    body: input,
  });
}

export async function deletePipeline(pipelineId) {
  return requestJson(`/api/v1/pipelines/${pipelineId}`, { method: 'DELETE' });
}

export async function addPipelineModule(pipelineId, input) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/modules`, {
    method: 'POST',
    body: input,
  });
}

export async function reorderPipelineModules(pipelineId, moduleIds) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/modules/reorder`, {
    method: 'PATCH',
    body: { moduleIds },
  });
}

export async function updatePipelineModulePosition(pipelineId, moduleId, position) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/modules/${moduleId}/position`, {
    method: 'PATCH',
    body: { position },
  });
}

export async function updatePipelineConnections(pipelineId, connectedAfter) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/connections`, {
    method: 'PATCH',
    body: { connectedAfter },
  });
}

export async function connectPipelineAfter(pipelineId, moduleId) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/connections/${moduleId}/connect`, {
    method: 'POST',
  });
}

export async function disconnectPipelineAfter(pipelineId, moduleId) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/connections/${moduleId}`, {
    method: 'DELETE',
  });
}

export async function removePipelineModule(pipelineId, moduleId) {
  return requestJson(`/api/v1/pipelines/${pipelineId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
}
