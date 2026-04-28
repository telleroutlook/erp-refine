/**
 * HTTP client wrapper for seed API calls.
 * Handles authentication and provides typed request methods with error reporting.
 */

export class SeedClient {
  private baseUrl: string;
  private token = '';

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.rawFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Login failed for ${email}: ${res.status} ${text}`);
    }
    const json = await res.json();
    this.token = json.data?.session?.accessToken ?? json.data?.session?.access_token;
    if (!this.token) throw new Error(`No token in login response for ${email}`);
    console.log(`  Logged in as ${email}`);
  }

  async post(path: string, body: Record<string, unknown>): Promise<any> {
    const res = await this.rawFetch(`/api${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
    }
    return json.data;
  }

  async get(path: string): Promise<any> {
    const res = await this.rawFetch(`/api${path}`, { method: 'GET' });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json)}`);
    }
    return json.data;
  }

  async put(path: string, body: Record<string, unknown>): Promise<any> {
    const res = await this.rawFetch(`/api${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`PUT ${path} → ${res.status}: ${JSON.stringify(json)}`);
    }
    return json.data;
  }

  private async rawFetch(path: string, init: RequestInit): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return fetch(`${this.baseUrl}${path}`, { ...init, headers });
  }
}
