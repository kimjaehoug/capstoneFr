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

export async function listDataSources({ userId } = {}) {
  return requestJson(`/api/v1/data-sources${toQuery({ userId })}`, {
    method: 'GET',
  });
}

export async function createDataSource(input) {
  return requestJson('/api/v1/data-sources', {
    method: 'POST',
    body: input,
  });
}

export async function getDataSource(dataSourceId) {
  return requestJson(`/api/v1/data-sources/${dataSourceId}`, {
    method: 'GET',
  });
}

export async function updateDataSource(dataSourceId, patch) {
  return requestJson(`/api/v1/data-sources/${dataSourceId}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function updateDataSourceLinkedPipeline(dataSourceId, linkedPipelineId) {
  return requestJson(`/api/v1/data-sources/${dataSourceId}/linked-pipeline`, {
    method: 'PATCH',
    body: {
      linkedPipelineId: linkedPipelineId ?? null,
    },
  });
}

export async function deleteDataSource(dataSourceId) {
  return requestJson(`/api/v1/data-sources/${dataSourceId}`, {
    method: 'DELETE',
  });
}
