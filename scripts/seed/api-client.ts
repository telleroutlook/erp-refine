// scripts/seed/api-client.ts
// HTTP client for seed script — wraps fetch with retry, auth, error collection

import type { SeedError } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class SeedApiClient {
  private apiUrl: string;
  private token: string;
  private errors: SeedError[] = [];
  private verbose: boolean;
  onRequest?: (method: string, path: string, status: number) => void;

  constructor(apiUrl: string, token: string, verbose = false) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.token = token;
    this.verbose = verbose;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getErrors(): SeedError[] {
    return this.errors;
  }

  clearErrors(): void {
    this.errors = [];
  }

  private log(msg: string): void {
    if (this.verbose) console.log(`  [api] ${msg}`);
  }

  async get<T = any>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.apiUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }
    this.log(`GET ${url.pathname}${url.search}`);
    const resp = await this.fetchWithRetry(url.toString(), { method: 'GET' });
    return resp;
  }

  async post<T = any>(path: string, body: unknown): Promise<T> {
    this.log(`POST ${path}`);
    return this.fetchWithRetry(`${this.apiUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T = any>(path: string, body: unknown): Promise<T> {
    this.log(`PUT ${path}`);
    return this.fetchWithRetry(`${this.apiUrl}${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T = any>(path: string): Promise<T> {
    this.log(`DELETE ${path}`);
    return this.fetchWithRetry(`${this.apiUrl}${path}`, {
      method: 'DELETE',
    });
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await fetch(url, { ...init, headers });
        const text = await resp.text();
        let json: any;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }

        const urlPath = new URL(url).pathname;
        this.onRequest?.(init.method ?? 'GET', urlPath, resp.status);

        if (resp.ok || resp.status === 201 || resp.status === 207) {
          return json;
        }

        // Retry on server errors or rate limiting
        if ((resp.status >= 500 || resp.status === 429) && attempt < MAX_RETRIES) {
          this.log(`  Retry ${attempt}/${MAX_RETRIES} (${resp.status})`);
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }

        // Non-retryable error
        const detail = json.detail ?? json.error ?? JSON.stringify(json);
        throw new ApiCallError(url, resp.status, detail);
      } catch (err) {
        if (err instanceof ApiCallError) throw err;
        if (attempt === MAX_RETRIES) {
          throw new ApiCallError(url, 0, (err as Error).message);
        }
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
    throw new ApiCallError(url, 0, 'Max retries exceeded');
  }

  /** Call and collect errors instead of throwing */
  async safePost<T = any>(
    path: string,
    body: unknown,
    meta: { phase: string; entity: string; index: number }
  ): Promise<T | null> {
    try {
      return await this.post<T>(path, body);
    } catch (err) {
      const msg = err instanceof ApiCallError ? err.detail : (err as Error).message;
      this.errors.push({ ...meta, message: msg });
      if (this.verbose) {
        console.log(`  ERROR [${meta.phase}] ${meta.entity}#${meta.index}: ${msg}`);
      }
      return null;
    }
  }

  /** Call and collect errors instead of throwing */
  async safePut<T = any>(
    path: string,
    body: unknown,
    meta: { phase: string; entity: string; index: number }
  ): Promise<T | null> {
    try {
      return await this.put<T>(path, body);
    } catch (err) {
      const msg = err instanceof ApiCallError ? err.detail : (err as Error).message;
      this.errors.push({ ...meta, message: msg });
      if (this.verbose) {
        console.log(`  ERROR [${meta.phase}] ${meta.entity}#${meta.index}: ${msg}`);
      }
      return null;
    }
  }

  async safeGet<T = any>(
    path: string,
    params?: Record<string, string | number>,
    meta?: { phase: string; entity: string; index: number }
  ): Promise<T | null> {
    try {
      return await this.get<T>(path, params);
    } catch (err) {
      const msg = err instanceof ApiCallError ? err.detail : (err as Error).message;
      if (meta) {
        this.errors.push({ ...meta, message: msg });
        if (this.verbose) {
          console.log(`  ERROR [${meta.phase}] ${meta.entity}#${meta.index}: ${msg}`);
        }
      }
      return null;
    }
  }

  async safeDelete<T = any>(
    path: string,
    meta: { phase: string; entity: string; index: number }
  ): Promise<T | null> {
    try {
      return await this.delete<T>(path);
    } catch (err) {
      const msg = err instanceof ApiCallError ? err.detail : (err as Error).message;
      this.errors.push({ ...meta, message: msg });
      if (this.verbose) {
        console.log(`  ERROR [${meta.phase}] ${meta.entity}#${meta.index}: ${msg}`);
      }
      return null;
    }
  }
}

export class ApiCallError extends Error {
  constructor(
    public url: string,
    public status: number,
    public detail: string
  ) {
    super(`API ${status} ${url}: ${detail}`);
    this.name = 'ApiCallError';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
