// Phase 0: Auth & Utility — test login for all users, /me, /refresh, utility endpoints
import type { TestContext } from '../../seed-api-test';

const USERS = [
  { email: 'admin@erp.demo', password: 'Admin2026!' },
  { email: 'finance@erp.demo', password: 'Admin2026!' },
  { email: 'sales@erp.demo', password: 'Admin2026!' },
  { email: 'purchasing@erp.demo', password: 'Admin2026!' },
  { email: 'warehouse@erp.demo', password: 'Admin2026!' },
  { email: 'manager@erp.demo', password: 'Admin2026!' },
  { email: 'admin@tech.demo', password: 'Admin2026!' },
  { email: 'sales@tech.demo', password: 'Admin2026!' },
  { email: 'finance@tech.demo', password: 'Admin2026!' },
];

export async function runPhase0(ctx: TestContext, org: string): Promise<void> {
  if (org !== 'org1') return; // auth is global, only run once
  const { api } = ctx;
  const meta = (entity: string, i: number) => ({ phase: 'phase0', entity, index: i });

  // Login all users and store tokens
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const result = await api.safePost<any>('/api/auth/login', u, meta('login', i));
    if (result?.data?.session?.accessToken) {
      ctx.tokens.set(u.email, result.data.session.accessToken);
      console.log(`    ✓ ${u.email} logged in`);

      // Test /me with this token
      const savedToken = ctx.org1Token;
      api.setToken(result.data.session.accessToken);
      await api.safeGet('/api/auth/me', undefined, meta('me', i));
      api.setToken(savedToken);

      // Test refresh for first user only
      if (i === 0 && result.data.session.refreshToken) {
        await api.safePost('/api/auth/refresh', { refreshToken: result.data.session.refreshToken }, meta('refresh', 0));
      }
    }
  }

  // Utility endpoints (no auth needed for /health)
  const apiUrl = api.getApiUrl();

  // /health — direct fetch since it may not need auth
  try {
    const resp = await fetch(`${apiUrl}/health`);
    ctx.coverage.record('GET', '/health', resp.status);
    console.log(`    ✓ GET /health → ${resp.status}`);
  } catch (e) {
    console.log(`    ✗ GET /health failed: ${(e as Error).message}`);
  }

  // /api — list resources
  await api.safeGet('/api', undefined, meta('api-index', 0));
  console.log('    ✓ GET /api');

  // /api/docs
  try {
    const resp = await fetch(`${apiUrl}/api/docs`, { headers: { Authorization: `Bearer ${ctx.org1Token}` } });
    ctx.coverage.record('GET', '/api/docs', resp.status);
    console.log(`    ✓ GET /api/docs → ${resp.status}`);
  } catch { /* ignore */ }

  // /api/openapi.json
  await api.safeGet('/api/openapi.json', undefined, meta('openapi', 0));
  console.log('    ✓ GET /api/openapi.json');
}
