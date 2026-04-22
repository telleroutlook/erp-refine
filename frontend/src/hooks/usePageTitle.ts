import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const RESOURCE_LABEL_KEY: Record<string, string> = {
  purchase_orders: 'menu.purchaseOrders',
  purchase_receipts: 'menu.purchaseReceipts',
  purchase_requisitions: 'menu.purchaseRequisitions',
  suppliers: 'menu.suppliers',
  supplier_invoices: 'menu.supplierInvoices',
  supplier_quotations: 'menu.supplierQuotations',
  rfq_headers: 'menu.rfqHeaders',
  advance_shipment_notices: 'menu.advanceShipmentNotices',
  reconciliation_statements: 'menu.reconciliationStatements',
  sales_orders: 'menu.salesOrders',
  sales_invoices: 'menu.salesInvoices',
  sales_shipments: 'menu.salesShipments',
  sales_returns: 'menu.salesReturns',
  customers: 'menu.customers',
  customer_receipts: 'menu.customerReceipts',
  stock_records: 'menu.stockRecords',
  warehouses: 'menu.warehouses',
  storage_locations: 'menu.storageLocations',
  inventory_counts: 'menu.inventoryCounts',
  inventory_lots: 'menu.inventoryLots',
  inventory_reservations: 'menu.inventoryReservations',
  serial_numbers: 'menu.serialNumbers',
  stock_transactions: 'menu.stockTransactions',
  bom_headers: 'menu.bomHeaders',
  work_orders: 'menu.workOrders',
  work_order_productions: 'menu.workOrderProductions',
  quality_standards: 'menu.qualityStandards',
  quality_inspections: 'menu.qualityInspections',
  defect_codes: 'menu.defectCodes',
  account_subjects: 'menu.accountSubjects',
  cost_centers: 'menu.costCenters',
  vouchers: 'menu.vouchers',
  budgets: 'menu.budgets',
  payment_requests: 'menu.paymentRequests',
  payment_records: 'menu.paymentRecords',
  exchange_rates: 'menu.exchangeRates',
  fixed_assets: 'menu.fixedAssets',
  asset_depreciations: 'menu.assetDepreciations',
  asset_maintenance_records: 'menu.assetMaintenance',
  contracts: 'menu.contracts',
  employees: 'menu.employees',
  departments: 'menu.departments',
  products: 'menu.products',
  product_categories: 'menu.productCategories',
  price_lists: 'menu.priceLists',
  carriers: 'menu.carriers',
  currencies: 'menu.currencies',
  uoms: 'menu.uoms',
  roles: 'menu.roles',
  user_roles: 'menu.userRoles',
  number_sequences: 'menu.numberSequences',
  notifications: 'menu.notifications',
  workflows: 'menu.workflows',
  approval_rules: 'menu.approvalRules',
  approval_records: 'menu.approvalRecords',
  document_attachments: 'menu.documentAttachments',
  document_relations: 'menu.documentRelations',
  profile_change_requests: 'menu.profileChangeRequests',
  token_usage: 'menu.tokenUsage',
  tool_call_metrics: 'menu.toolCallMetrics',
  agent_sessions: 'menu.agentSessions',
  agent_decisions: 'menu.agentDecisions',
  business_events: 'menu.businessEvents',
  auth_events: 'menu.authEvents',
  import_logs: 'menu.importLogs',
};

function humanizeTable(table: string): string {
  return table
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function usePageTitle() {
  const { t, i18n } = useTranslation();

  return useCallback(
    (table: string, action: 'list' | 'create' | 'edit' | 'show', params?: Record<string, string>): string => {
      const explicit = t(`titles.${table}.${action}`, { ...params, defaultValue: '' });
      if (explicit) return explicit;

      const resourceKey = RESOURCE_LABEL_KEY[table];
      const resource = resourceKey ? t(resourceKey) : humanizeTable(table);
      const actionLabel = t(`actions.${action}`, { defaultValue: action });
      return `${actionLabel} ${resource}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}
