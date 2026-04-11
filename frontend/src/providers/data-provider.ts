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

    // Append filters
    if (filters) {
      for (const filter of filters) {
        if ('field' in filter) {
          params.append(filter.field, String(filter.value));
        }
      }
    }

    const response = await fetch(`${API_URL}/${resource}?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error ?? 'Request failed');
    }

    const json = await response.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  getOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Not found');
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
      const err = await response.json().catch(() => ({ error: 'Create failed' }));
      throw new Error(err.error ?? 'Create failed');
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
      const err = await response.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(err.error ?? 'Update failed');
    }

    const json = await response.json();
    return { data: json.data };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Delete failed');
    const json = await response.json();
    return { data: json.data };
  },

  getApiUrl: () => API_URL,
};
