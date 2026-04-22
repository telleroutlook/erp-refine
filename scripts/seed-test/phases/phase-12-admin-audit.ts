// Phase 12: Admin Audit — All 12 read-only admin audit entities
import type { TestContext } from '../../seed-api-test';

const P = 'phase12';

const AUDIT_ENTITIES = [
  'token-usage',
  'tool-call-metrics',
  'agent-sessions',
  'agent-decisions',
  'business-events',
  'auth-events',
  'failed-login-attempts',
  'import-logs',
  'portal-users',
  'semantic-metadata',
  'component-whitelist',
  'schema-versions',
];

export async function runPhase12(ctx: TestContext, org: string): Promise<void> {
  if (org !== 'org1') return; // admin audit is global, run once
  const { api } = ctx;
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  for (let i = 0; i < AUDIT_ENTITIES.length; i++) {
    const entity = AUDIT_ENTITIES[i];
    const path = `/api/admin/${entity}`;

    // GET list
    const list = await api.safeGet<any>(path, { _limit: 3 }, meta(entity + '-list', i));
    const count = list?.data?.length ?? 0;
    console.log(`    GET ${path} → ${count} items`);

    // GET by ID if any exist
    if (list?.data?.[0]?.id) {
      await api.safeGet(`${path}/${list.data[0].id}`, undefined, meta(entity + '-get', i));
    }
  }

  console.log(`    Phase 12 done`);
}
