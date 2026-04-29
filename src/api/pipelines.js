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
