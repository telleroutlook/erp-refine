// src/providers/data-provider.ts
// Refine DataProvider backed by our BFF REST API

import { type DataProvider } from '@refinedev/core';
import { API_URL } from '../constants/api';
import { getAuthHeaders } from './token';
import { refreshAccessToken } from './auth-provider';

class HttpError extends Error {
  status: number;
  statusCode: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.statusCode = status;
  }
}

const ADMIN_RESOURCES = new Set([
  'roles', 'user-roles', 'role-permissions', 'approval-rules', 'approval-rule-steps',
  'approval-records',
  'token-usage', 'tool-call-metrics', 'agent-sessions', 'agent-decisions',
  'business-events', 'auth-events', 'import-logs',
  'failed-login-attempts', 'portal-users',
  'semantic-metadata', 'component-whitelist', 'schema-versions',
]);

function resolveUrl(resource: string): string {
  if (ADMIN_RESOURCES.has(resource)) return `${API_URL}/admin/${resource}`;
  return `${API_URL}/${resource}`;
}

function getHeaders(): Record<string, string> {
  return getAuthHeaders();
}

async function fetchWithRetry(url: string, init?: RequestInit, attempt = 0): Promise<Response> {
  const MAX_RETRIES = 3;
  let response = await fetch(url, init);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryInit = { ...init, headers: getHeaders() };
      response = await fetch(url, retryInit);
    }
    return response;
  }

  if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After');
    const baseDelay = retryAfter ? Number(retryAfter) * 1000 : 1000 * Math.pow(2, attempt);
    const jitter = Math.random() * 500;
    await new Promise((r) => setTimeout(r, baseDelay + jitter));
    const retryInit = { ...init, headers: getHeaders() };
    return fetchWithRetry(url, retryInit, attempt + 1);
  }

  return response;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const page = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    const params = new URLSearchParams({
      _page: String(page),
      _limit: String(pageSize),
    });

    if (sorters && sorters.length > 0) {
      params.set('_sort', sorters.map(s => s.field).join(','));
      params.set('_order', sorters.map(s => s.order).join(','));
    } else {
      params.set('_sort', 'created_at');
      params.set('_order', 'desc');
    }

    // Append filters — map Refine operators to query params
    if (filters) {
      for (const filter of filters) {
        if ('field' in filter) {
          const { field, operator, value } = filter;
          if (value === undefined || value === null || value === '') continue;

          // Item-level filters: passed through as-is, bypass operator mapping
          if (field.startsWith('_item_')) {
            params.append(field, String(value));
            continue;
          }

          if (operator === 'eq' || operator === undefined) {
            params.append(field, String(value));
          } else if (operator === 'ne') {
            params.append(`${field}_ne`, String(value));
          } else if (operator === 'contains') {
            params.append(`${field}_like`, String(value));
          } else if (operator === 'in') {
            params.append(`${field}_in`, Array.isArray(value) ? value.join(',') : String(value));
          } else if (operator === 'null') {
            params.append(`${field}_is`, 'null');
          } else if (operator === 'nnull') {
            params.append(`${field}_is`, 'not.null');
          } else if (operator === 'gte') {
            params.append(`${field}_gte`, String(value));
          } else if (operator === 'lte') {
            params.append(`${field}_lte`, String(value));
          } else if (operator === 'gt') {
            params.append(`${field}_gt`, String(value));
          } else if (operator === 'lt') {
            params.append(`${field}_lt`, String(value));
          }
        }
      }
    }

    const response = await fetchWithRetry(`${resolveUrl(resource)}?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new HttpError(err.detail ?? err.error ?? 'Request failed', response.status);
    }

    const json = await response.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  getOne: async ({ resource, id }) => {
    const response = await fetchWithRetry(`${resolveUrl(resource)}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new HttpError(err.detail ?? err.error ?? `HTTP ${response.status}`, response.status);
    }
    const json = await response.json();
    if (!json.data) throw new HttpError('Unexpected response: missing data', response.status);
    return { data: json.data };
  },

  create: async ({ resource, variables }) => {
    const response = await fetchWithRetry(`${resolveUrl(resource)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Create failed' }));
      throw new HttpError(err.detail ?? err.error ?? 'Create failed', response.status);
    }

    const json = await response.json();
    if (!json.data) throw new HttpError('Unexpected response: missing data', response.status);
    return { data: json.data };
  },

  update: async ({ resource, id, variables }) => {
    const response = await fetchWithRetry(`${resolveUrl(resource)}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Update failed' }));
      throw new HttpError(err.detail ?? err.error ?? 'Update failed', response.status);
    }

    const json = await response.json();
    if (!json.data) throw new HttpError('Unexpected response: missing data', response.status);
    return { data: json.data };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await fetchWithRetry(`${resolveUrl(resource)}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new HttpError(err.detail ?? err.error ?? 'Delete failed', response.status);
    }
    const json = response.status !== 204
      ? await response.json().catch(() => ({}))
      : {};
    return { data: json.data ?? { id } };
  },

  getApiUrl: () => API_URL,
};
