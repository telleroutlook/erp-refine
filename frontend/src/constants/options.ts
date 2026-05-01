import type { TFunction } from 'i18next';

export function translateOptions(
  options: { value: string }[],
  t: TFunction,
  prefix = 'status',
): { value: string; label: string }[] {
  return options.map((o) => ({ value: o.value, label: t(`${prefix}.${o.value}`) }));
}

export const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export const PO_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'submitted' },
  { value: 'approved' },
  { value: 'rejected' },
  { value: 'in_transit' },
  { value: 'partially_received' },
  { value: 'received' },
  { value: 'closed' },
  { value: 'cancelled' },
];

export const SO_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'submitted' },
  { value: 'confirmed' },
  { value: 'approved' },
  { value: 'rejected' },
  { value: 'shipping' },
  { value: 'shipped' },
  { value: 'completed' },
  { value: 'cancelled' },
];

export const SHIPMENT_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'confirmed' },
  { value: 'shipped' },
  { value: 'delivered' },
  { value: 'cancelled' },
];

export const RETURN_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'approved' },
  { value: 'received' },
  { value: 'rejected' },
  { value: 'cancelled' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'received' },
  { value: 'verified' },
  { value: 'approved' },
  { value: 'paid' },
  { value: 'disputed' },
  { value: 'cancelled' },
];

export const PAYMENT_REQUEST_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'submitted' },
  { value: 'approved' },
  { value: 'paid' },
  { value: 'rejected' },
  { value: 'cancelled' },
];

export const RECEIPT_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'confirmed' },
  { value: 'cancelled' },
];

export const WORK_ORDER_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'released' },
  { value: 'in_progress' },
  { value: 'completed' },
  { value: 'cancelled' },
];

export const INSPECTION_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'in_progress' },
  { value: 'completed' },
  { value: 'cancelled' },
];

export const INSPECTION_RESULT_OPTIONS = [
  { value: 'pass' },
  { value: 'fail' },
  { value: 'conditional' },
];

export const INSPECTION_REFERENCE_TYPE_OPTIONS = [
  { value: 'purchase_receipt' },
  { value: 'work_order' },
  { value: 'sales_return' },
  { value: 'in_process' },
  { value: 'final' },
];

export const DEFECT_SEVERITY_OPTIONS = [
  { value: 'critical' },
  { value: 'major' },
  { value: 'minor' },
];

export const REQUISITION_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'submitted' },
  { value: 'approved' },
  { value: 'rejected' },
  { value: 'cancelled' },
  { value: 'converted' },
];

export const RFQ_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'issued' },
  { value: 'closed' },
  { value: 'cancelled' },
];

export const QUOTATION_STATUS_OPTIONS = [
  { value: 'received' },
  { value: 'evaluated' },
  { value: 'selected' },
  { value: 'rejected' },
];

export const VOUCHER_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'approved' },
  { value: 'posted' },
  { value: 'voided' },
  { value: 'cancelled' },
];

export const BUDGET_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'approved' },
  { value: 'active' },
  { value: 'closed' },
];

export const PAYMENT_RECORD_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'confirmed' },
  { value: 'cancelled' },
];

export const ASSET_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'disposed' },
  { value: 'under_maintenance' },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'active' },
  { value: 'expired' },
  { value: 'terminated' },
  { value: 'cancelled' },
  { value: 'completed' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'sales' },
  { value: 'procurement' },
  { value: 'service' },
  { value: 'framework' },
];

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'inactive' },
  { value: 'terminated' },
];

export const DEPARTMENT_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'inactive' },
];

export const COUNT_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'in_progress' },
  { value: 'completed' },
  { value: 'cancelled' },
];

export const LOT_STATUS_OPTIONS = [
  { value: 'available' },
  { value: 'quarantine' },
  { value: 'expired' },
  { value: 'consumed' },
];

export const SERIAL_STATUS_OPTIONS = [
  { value: 'in_stock' },
  { value: 'sold' },
  { value: 'scrapped' },
  { value: 'returned' },
];

export const PRICE_LIST_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'active' },
  { value: 'inactive' },
];

export const CUSTOMER_RECEIPT_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'confirmed' },
  { value: 'reconciled' },
  { value: 'cancelled' },
];

export const RESERVATION_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'released' },
  { value: 'expired' },
  { value: 'consumed' },
  { value: 'cancelled' },
];

export const VOUCHER_TYPE_OPTIONS = [
  { value: 'general' },
  { value: 'receipt' },
  { value: 'payment' },
  { value: 'transfer' },
];

export const PRODUCT_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'inactive' },
  { value: 'discontinued' },
];

export const ASN_STATUS_OPTIONS = [
  { value: 'open' },
  { value: 'received' },
  { value: 'cancelled' },
];

export const RECONCILIATION_STATUS_OPTIONS = [
  { value: 'draft' },
  { value: 'confirmed' },
  { value: 'closed' },
  { value: 'cancelled' },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'in' },
  { value: 'out' },
  { value: 'transfer' },
  { value: 'adjust' },
];

export const IMPORT_STATUS_OPTIONS = [
  { value: 'processing' },
  { value: 'completed' },
  { value: 'failed' },
];

export const AGENT_SESSION_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'completed' },
  { value: 'aborted' },
  { value: 'expired' },
];

export const WORKFLOW_STATUS_OPTIONS = [
  { value: 'pending' },
  { value: 'in_progress' },
  { value: 'completed' },
  { value: 'cancelled' },
  { value: 'failed' },
];

export const APPROVAL_RECORD_STATUS_OPTIONS = [
  { value: 'pending' },
  { value: 'approved' },
  { value: 'rejected' },
  { value: 'recalled' },
];

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  action_required: 'red',
  approval: 'purple',
  system: 'default',
};

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'info' },
  { value: 'warning' },
  { value: 'action_required' },
  { value: 'approval' },
  { value: 'system' },
];

export const MATCH_STATUS_OPTIONS = [
  { value: 'matched' },
  { value: 'partial_match' },
  { value: 'mismatched' },
  { value: 'pending' },
];

export const ORGANIZATION_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'inactive' },
];

export const COST_METHOD_OPTIONS = [
  { value: 'weighted_average' },
  { value: 'fifo' },
  { value: 'standard' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer' },
  { value: 'cash' },
  { value: 'check' },
  { value: 'alipay' },
  { value: 'wechat' },
  { value: 'other' },
];

export const PORTAL_USER_STATUS_OPTIONS = [
  { value: 'active' },
  { value: 'inactive' },
  { value: 'suspended' },
];
