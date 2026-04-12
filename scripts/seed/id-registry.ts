// scripts/seed/id-registry.ts
// Code-to-UUID resolution via API list endpoint preloading

import type { SeedApiClient } from './api-client';

export class IdRegistry {
  private maps = new Map<string, Map<string, string>>();

  /** Store a code→id mapping */
  register(entityType: string, code: string, id: string): void {
    if (!this.maps.has(entityType)) {
      this.maps.set(entityType, new Map());
    }
    this.maps.get(entityType)!.set(code, id);
  }

  /** Get id by code. Throws if not found. */
  get(entityType: string, code: string): string {
    const id = this.tryGet(entityType, code);
    if (!id) {
      throw new Error(`IdRegistry: '${entityType}' code '${code}' not found. Available: ${this.listCodes(entityType)}`);
    }
    return id;
  }

  /** Get id by code. Returns null if not found. */
  tryGet(entityType: string, code: string): string | null {
    return this.maps.get(entityType)?.get(code) ?? null;
  }

  /** Check if a code exists */
  has(entityType: string, code: string): boolean {
    return this.maps.get(entityType)?.has(code) ?? false;
  }

  /** Get all codes for an entity type */
  codes(entityType: string): string[] {
    const m = this.maps.get(entityType);
    return m ? Array.from(m.keys()) : [];
  }

  /** Get all entries for an entity type */
  entries(entityType: string): Array<[string, string]> {
    const m = this.maps.get(entityType);
    return m ? Array.from(m.entries()) : [];
  }

  /** Count entries for an entity type */
  count(entityType: string): number {
    return this.maps.get(entityType)?.size ?? 0;
  }

  /** List first N codes for error messages */
  private listCodes(entityType: string): string {
    const codes = this.codes(entityType).slice(0, 10);
    return codes.length > 0 ? codes.join(', ') : '(none loaded)';
  }

  /**
   * Preload code→id mappings from an API list endpoint.
   * Fetches all records by paginating and builds the lookup map.
   */
  async preloadFromApi(
    client: SeedApiClient,
    entityType: string,
    apiPath: string,
    codeField: string,
    idField: string = 'id'
  ): Promise<number> {
    const pageSize = 500;
    let page = 1;
    let loaded = 0;

    while (true) {
      const resp: any = await client.get(apiPath, { _page: page, _limit: pageSize });
      const records = resp.data ?? [];
      if (records.length === 0) break;

      for (const record of records) {
        const code = record[codeField];
        const id = record[idField];
        if (code && id) {
          this.register(entityType, String(code), String(id));
          loaded++;
        }
      }

      // If we got fewer than pageSize, we've fetched everything
      if (records.length < pageSize) break;
      page++;
    }

    return loaded;
  }

  /**
   * Preload all master data entities from API endpoints.
   * Should be called after Phase 1 (master data import).
   */
  async preloadAll(client: SeedApiClient): Promise<Record<string, number>> {
    const preloads: Array<[string, string, string]> = [
      ['product', '/api/products', 'code'],
      ['customer', '/api/customers', 'code'],
      ['supplier', '/api/suppliers', 'code'],
      ['warehouse', '/api/warehouses', 'code'],
      ['department', '/api/departments', 'code'],
      ['carrier', '/api/carriers', 'code'],
      ['account', '/api/account-subjects', 'code'],
      ['cost_center', '/api/cost-centers', 'code'],
      ['employee', '/api/employees', 'employee_number'],
      ['defect_code', '/api/defect-codes', 'code'],
      ['tax_code', '/api/tax-codes', 'code'],
      ['category', '/api/product-categories', 'code'],
      ['storage_location', '/api/storage-locations', 'location_code'],
    ];

    const counts: Record<string, number> = {};
    for (const [entityType, path, codeField] of preloads) {
      counts[entityType] = await this.preloadFromApi(client, entityType, path, codeField);
    }
    return counts;
  }
}
