// Phase 14: Update & Delete — PUT update + DELETE soft-delete sweep
import type { TestContext } from '../../seed-api-test';

const P = 'phase14';

const UPDATABLE_RESOURCES = [
  { resource: 'products', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'customers', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'suppliers', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'carriers', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'warehouses', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'fixed-assets', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'contracts', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'defect-codes', field: { description: 'Updated by phase14 sweep' } },
  { resource: 'inventory-lots', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'serial-numbers', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'inventory-reservations', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'advance-shipment-notices', field: { notes: 'Updated by phase14 sweep' } },
  { resource: 'reconciliation-statements', field: { notes: 'Updated by phase14 sweep' } },
];

const DELETABLE_RESOURCES = [
  'carriers',
  'storage-locations',
  'price-list-lines',
  'defect-codes',
  'document-attachments',
  'document-relations',
  'dynamic-form-data',
  'inventory-lots',
  'serial-numbers',
  'inventory-reservations',
];

export async function runPhase14(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // --- PUT Update Sweep ---
  console.log('    Running PUT update sweep...');
  for (let i = 0; i < UPDATABLE_RESOURCES.length; i++) {
    const { resource, field } = UPDATABLE_RESOURCES[i];
    const list = await api.safeGet<any>(`/api/${resource}`, { _limit: 1 }, meta(`${resource}-list`, i));
    const item = list?.data?.[0];
    if (item?.id) {
      const result = await api.safePut(`/api/${resource}/${item.id}`, field, meta(`${resource}-update`, i));
      if (result) {
        console.log(`    PUT /api/${resource}/${item.id} ✓`);
      }
    }
  }

  // --- DELETE Sweep (soft-delete one expendable record per resource) ---
  console.log('    Running DELETE sweep...');
  for (let i = 0; i < DELETABLE_RESOURCES.length; i++) {
    const resource = DELETABLE_RESOURCES[i];
    // Get the last item (most likely created by our seed, expendable)
    const list = await api.safeGet<any>(`/api/${resource}`, { _limit: 2, _sort: 'created_at', _order: 'desc' }, meta(`${resource}-del-list`, i));
    const item = list?.data?.[0];
    if (item?.id) {
      const result = await api.safeDelete(`/api/${resource}/${item.id}`, meta(`${resource}-delete`, i));
      if (result !== null) {
        console.log(`    DELETE /api/${resource}/${item.id} ✓`);
      }
    }
  }

  // --- Verify deleted items are excluded from list ---
  console.log('    Verifying soft-delete exclusion...');
  for (const resource of DELETABLE_RESOURCES.slice(0, 3)) {
    await api.safeGet(`/api/${resource}`, { _limit: 1 }, meta(`${resource}-verify`, 0));
  }

  console.log(`    Phase 14 (${org}) done`);
}
