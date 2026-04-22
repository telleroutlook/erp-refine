// Phase 15: Schema & Chat — test schema endpoints and AI chat
import type { TestContext } from '../../seed-api-test';

const P = 'phase15';

export async function runPhase15(ctx: TestContext, org: string): Promise<void> {
  if (org !== 'org1') return; // schema is global, run once
  const { api } = ctx;
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // --- Schema endpoints ---
  const schemas = await api.safeGet<any>('/api/schema', { _limit: 5 }, meta('schema-list', 0));
  console.log(`    GET /api/schema → ${schemas?.data?.length ?? 0} schemas`);
  if (schemas?.data?.[0]?.id) {
    await api.safeGet(`/api/schema/${schemas.data[0].id}`, undefined, meta('schema-get', 0));
  }

  // --- Chat endpoint (send a simple query) ---
  const chatResult = await api.safePost<any>('/api/chat', {
    messages: [
      { role: 'user', content: '你好，请列出当前系统中有多少个供应商？' }
    ],
  }, meta('chat', 0));
  if (chatResult) {
    console.log(`    POST /api/chat → responded`);
  }

  // --- Test auth logout (last, since it invalidates session) ---
  // We'll use a dedicated token for this
  const loginResult = await api.safePost<any>('/api/auth/login', {
    email: 'warehouse@erp.demo',
    password: 'Admin2026!',
  }, meta('login-for-logout', 0));
  if (loginResult?.data?.session?.accessToken) {
    const savedToken = ctx.org1Token;
    api.setToken(loginResult.data.session.accessToken);
    await api.safePost('/api/auth/logout', {}, meta('logout', 0));
    console.log(`    POST /api/auth/logout ✓`);
    api.setToken(savedToken);
  }

  console.log(`    Phase 15 done`);
}
