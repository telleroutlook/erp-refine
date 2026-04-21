// src/providers/data-provider.ts
// Refine DataProvider backed by our BFF REST API

import { type DataProvider } from '@refinedev/core';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const page = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const sortField = sorters?.[0]?.field ?? 'created_at';
    const sortOrder = sorters?.[0]?.order ?? 'desc';

    const params = new URLSearchParams({
      _page: String(page),
      _limit: String(pageSize),
      _sort: sortField,
      _order: sortOrder,
    });

    // Append filters — map Refine operators to query params
    if (filters) {
      for (const filter of filters) {
        if ('field' in filter) {
          const { field, operator, value } = filter;
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
          }
        }
      }
    }

    const response = await fetch(`${API_URL}/${resource}?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail ?? err.error ?? 'Request failed');
    }

    const json = await response.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  getOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail ?? err.error ?? `HTTP ${response.status}`);
    }
    const json = await response.json();
    return { data: json.data };
  },

  create: async ({ resource, variables }) => {
    const response = await fetch(`${API_URL}/${resource}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Create failed' }));
      throw new Error(err.detail ?? err.error ?? 'Create failed');
    }

    const json = await response.json();
    return { data: json.data };
  },

  update: async ({ resource, id, variables }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Update failed' }));
      throw new Error(err.detail ?? err.error ?? 'Update failed');
    }

    const json = await response.json();
    return { data: json.data };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(err.detail ?? err.error ?? 'Delete failed');
    }
    const json = await response.json();
    return { data: json.data };
  },

  getApiUrl: () => API_URL,
};
