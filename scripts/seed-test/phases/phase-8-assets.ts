// Phase 8: Assets — Fixed Assets CRUD, Depreciations, Maintenance
import type { TestContext } from '../../seed-api-test';

const P = 'phase8';

export async function runPhase8(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups
  const depts = await api.safeGet<any>('/api/departments', { _limit: 3 }, meta('dept-lookup', 0));
  const deptIds = (depts?.data ?? []).map((d: any) => d.id);
  const emps = await api.safeGet<any>('/api/employees', { _limit: 3 }, meta('emp-lookup', 0));
  const empIds = (emps?.data ?? []).map((e: any) => e.id);
  const ccs = await api.safeGet<any>('/api/cost-centers', { _limit: 2 }, meta('cc-lookup', 0));
  const ccIds = (ccs?.data ?? []).map((c: any) => c.id);

  // --- Fixed Assets ---
  // Columns: asset_name, asset_number, category, acquisition_date, acquisition_cost, salvage_value,
  //          useful_life_months, depreciation_method, status, department, cost_center_id, custodian_id, location, notes
  const assets = [
    {
      asset_name: isOrg2 ? '办公电脑-T' : '办公电脑-API',
      asset_number: isOrg2 ? 'FA-PC-T' : 'FA-PC-A',
      category: '电子设备',
      acquisition_date: '2025-06-15',
      acquisition_cost: 8000,
      salvage_value: 500,
      useful_life_months: 36,
      depreciation_method: 'straight_line',
      status: 'active',
      cost_center_id: ccIds[0],
      custodian_id: empIds[0],
    },
    {
      asset_name: isOrg2 ? '打印机-T' : '打印机-API',
      asset_number: isOrg2 ? 'FA-PR-T' : 'FA-PR-A',
      category: '办公设备',
      acquisition_date: '2024-01-10',
      acquisition_cost: 15000,
      salvage_value: 1000,
      useful_life_months: 60,
      depreciation_method: 'straight_line',
      status: 'active',
      cost_center_id: ccIds[0],
    },
    {
      asset_name: isOrg2 ? '运输车辆-T' : '运输车辆-API',
      asset_number: isOrg2 ? 'FA-VH-T' : 'FA-VH-A',
      category: '运输设备',
      acquisition_date: '2023-08-20',
      acquisition_cost: 250000,
      salvage_value: 25000,
      useful_life_months: 120,
      depreciation_method: 'declining_balance',
      status: 'under_maintenance',
      cost_center_id: ccIds[0],
    },
  ];

  const assetIds: string[] = [];
  for (let i = 0; i < assets.length; i++) {
    const result = await api.safePost<any>('/api/fixed-assets', assets[i], meta('asset-create', i));
    if (result?.data?.id) {
      assetIds.push(result.data.id);
      console.log(`    POST Asset → ${result.data.id} (${assets[i].asset_name})`);
      ctx.createdIds.set('fixed-assets', [...(ctx.createdIds.get('fixed-assets') ?? []), result.data.id]);
    }
  }

  // GET list + by ID
  await api.safeGet('/api/fixed-assets', { _limit: 10 }, meta('asset-list', 0));
  if (assetIds[0]) {
    await api.safeGet(`/api/fixed-assets/${assetIds[0]}`, undefined, meta('asset-get', 0));
    // PUT update
    await api.safePut(`/api/fixed-assets/${assetIds[0]}`, { notes: 'Updated by API test' }, meta('asset-update', 0));
  }

  // --- Asset Depreciations ---
  // Get existing assets for depreciation
  const existingAssets = await api.safeGet<any>('/api/fixed-assets', { _limit: 5, status: 'active' }, meta('asset-for-depr', 0));
  const depAssetIds = (existingAssets?.data ?? []).map((a: any) => a.id);

  for (let i = 0; i < Math.min(4, depAssetIds.length); i++) {
    const asset = existingAssets?.data?.[i];
    const monthlyDepr = asset ? (asset.acquisition_cost - (asset.salvage_value ?? 0)) / (asset.useful_life_months ?? 36) : 200;
    const result = await api.safePost<any>('/api/asset-depreciations', {
      asset_id: depAssetIds[i],
      period_year: 2026,
      period_month: 3 + i,
      depreciation_amount: Math.round(monthlyDepr * 100) / 100,
      accumulated_depreciation: Math.round(monthlyDepr * (i + 1) * 100) / 100,
      book_value_after: asset ? Math.round((asset.acquisition_cost - monthlyDepr * (i + 1)) * 100) / 100 : 7000,
    }, meta('depreciation', i));
    if (result?.data?.id) {
      console.log(`    POST Depreciation → ${result.data.id}`);
    }
  }
  await api.safeGet('/api/asset-depreciations', { _limit: 10 }, meta('depr-list', 0));

  // --- Asset Maintenance ---
  const maintenanceTypes = ['routine', 'repair', 'overhaul'] as const;
  for (let i = 0; i < Math.min(3, depAssetIds.length); i++) {
    const result = await api.safePost<any>('/api/asset-maintenance', {
      asset_id: depAssetIds[i],
      maintenance_type: maintenanceTypes[i],
      description: `${maintenanceTypes[i]} maintenance - API seed #${i + 1}`,
      cost: 500 + i * 1000,
      performed_by: empIds[0] ?? 'System',
      performed_at: `2026-04-${String(15 + i).padStart(2, '0')}`,
      next_due_at: `2026-07-${String(15 + i).padStart(2, '0')}`,
    }, meta('maintenance', i));
    if (result?.data?.id) {
      console.log(`    POST Maintenance → ${result.data.id} (${maintenanceTypes[i]})`);
    }
  }
  await api.safeGet('/api/asset-maintenance', { _limit: 10 }, meta('maint-list', 0));

  console.log(`    Phase 8 (${org}) done`);
}
