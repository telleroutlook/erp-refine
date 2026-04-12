// scripts/seed/types.ts
// Shared types for the seed data generator

export interface SeedConfig {
  apiUrl: string;
  token: string;
  token2: string;
  dryRun: boolean;
  phases: number[];
  clean: boolean;
  verbose: boolean;
  org1Only: boolean;
  org2Only: boolean;
}

export interface OrgConfig {
  organizationId: string;
  name: string;
  token: string;
}

export interface SeedError {
  phase: string;
  entity: string;
  index: number;
  message: string;
  detail?: string;
}

export interface PhaseResult {
  phase: string;
  created: number;
  skipped: number;
  errors: SeedError[];
  durationMs: number;
}

export interface SeedReport {
  startedAt: Date;
  completedAt?: Date;
  org: string;
  phases: PhaseResult[];
  totalCreated: number;
  totalErrors: number;
}

export interface GeneratedDocument {
  id: string;
  orderNumber?: string;
  date: string;
  status: string;
  /** Items associated with this document */
  itemCount: number;
  /** Reference keys for linking (e.g., supplier_code, customer_code) */
  refs: Record<string, string>;
}

/** Product info used by transaction generators */
export interface ProductInfo {
  code: string;
  type: string;
  costPrice: number;
  listPrice: number;
}

/** Context passed between phases within a single org */
export interface PhaseSeedContext {
  org: OrgConfig;
  config: SeedConfig;
  /** Generated POs with their IDs for linking to receipts/invoices */
  purchaseOrders: GeneratedDocument[];
  /** Generated SOs with their IDs for linking to shipments/invoices */
  salesOrders: GeneratedDocument[];
  /** Confirmed purchase receipts */
  purchaseReceipts: GeneratedDocument[];
  /** Confirmed sales shipments */
  salesShipments: GeneratedDocument[];
  /** Created supplier invoices */
  supplierInvoices: GeneratedDocument[];
  /** Created sales invoices */
  salesInvoices: GeneratedDocument[];
  /** Created BOM IDs */
  bomHeaders: GeneratedDocument[];
  /** Created work order IDs */
  workOrders: GeneratedDocument[];
}

export function createEmptyContext(org: OrgConfig, config: SeedConfig): PhaseSeedContext {
  return {
    org,
    config,
    purchaseOrders: [],
    salesOrders: [],
    purchaseReceipts: [],
    salesShipments: [],
    supplierInvoices: [],
    salesInvoices: [],
    bomHeaders: [],
    workOrders: [],
  };
}
