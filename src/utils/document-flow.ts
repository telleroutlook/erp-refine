// src/utils/document-flow.ts
// Central configuration for all document flow (参考创建) relationships.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DocumentFlowConfig {
  sourceType: string;
  sourceTable: string;
  sourceItemsTable: string;
  sourceItemFk: string;
  sourceDetailSelect: string;
  sourceValidStatuses: string[];
  sourceNumberField: string;

  targetType: string;
  targetTable: string;
  targetItemsTable: string;
  targetItemFk: string;

  headerMapping: (source: Record<string, unknown>) => Record<string, unknown>;
  itemMapping: (item: Record<string, unknown>, openQty: number) => Record<string, unknown>;

  quantityField: string;
  fulfilledFields?: string[];

  targetSourceFk?: string;
  targetItemSourceItemFk?: string;

  sequenceName: string;
  relationLabel: string;
}

// ─── PR → PO ───
const prToPo: DocumentFlowConfig = {
  sourceType: 'purchase_requisition',
  sourceTable: 'purchase_requisitions',
  sourceItemsTable: 'purchase_requisition_lines',
  sourceItemFk: 'purchase_requisition_id',
  sourceDetailSelect: '*, items:purchase_requisition_lines(*, product:products(id,name,code,uom,cost_price))',
  sourceValidStatuses: ['approved'],
  sourceNumberField: 'requisition_number',

  targetType: 'purchase_order',
  targetTable: 'purchase_orders',
  targetItemsTable: 'purchase_order_items',
  targetItemFk: 'purchase_order_id',

  headerMapping: (src) => ({
    supplier_id: src._suggested_supplier_id ?? undefined,
    notes: src.notes,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price ?? (item.product as any)?.cost_price ?? 0,
    tax_rate: 0,
    notes: item.notes,
  }),

  quantityField: 'quantity',
  // PR lines have no fulfilled fields; open qty computed by aggregation

  sequenceName: 'purchase_order',
  relationLabel: 'PR → PO',
};

// ─── PO → Purchase Receipt ───
const poToReceipt: DocumentFlowConfig = {
  sourceType: 'purchase_order',
  sourceTable: 'purchase_orders',
  sourceItemsTable: 'purchase_order_items',
  sourceItemFk: 'purchase_order_id',
  sourceDetailSelect: '*, supplier:suppliers(id,name), items:purchase_order_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['approved', 'partially_received'],
  sourceNumberField: 'order_number',

  targetType: 'purchase_receipt',
  targetTable: 'purchase_receipts',
  targetItemsTable: 'purchase_receipt_items',
  targetItemFk: 'purchase_receipt_id',

  headerMapping: (src) => ({
    supplier_id: src.supplier_id,
    purchase_order_id: src.id,
    warehouse_id: src.warehouse_id,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    purchase_order_item_id: item.id,
  }),

  quantityField: 'quantity',
  fulfilledFields: ['received_quantity'],

  targetSourceFk: 'purchase_order_id',
  targetItemSourceItemFk: 'purchase_order_item_id',

  sequenceName: 'purchase_receipt',
  relationLabel: 'PO → Receipt',
};

// ─── PO → Supplier Invoice ───
const poToSupplierInvoice: DocumentFlowConfig = {
  sourceType: 'purchase_order',
  sourceTable: 'purchase_orders',
  sourceItemsTable: 'purchase_order_items',
  sourceItemFk: 'purchase_order_id',
  sourceDetailSelect: '*, supplier:suppliers(id,name), items:purchase_order_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['approved', 'partially_received', 'received'],
  sourceNumberField: 'order_number',

  targetType: 'supplier_invoice',
  targetTable: 'supplier_invoices',
  targetItemsTable: 'supplier_invoice_items',
  targetItemFk: 'supplier_invoice_id',

  headerMapping: (src) => ({
    supplier_id: src.supplier_id,
    purchase_order_id: src.id,
    currency: src.currency,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate ?? 0,
    purchase_order_item_id: item.id,
  }),

  quantityField: 'quantity',
  fulfilledFields: ['invoiced_quantity'],

  targetSourceFk: 'purchase_order_id',
  targetItemSourceItemFk: 'purchase_order_item_id',

  sequenceName: 'supplier_invoice',
  relationLabel: 'PO → Supplier Invoice',
};

// ─── Purchase Receipt → Supplier Invoice ───
const receiptToSupplierInvoice: DocumentFlowConfig = {
  sourceType: 'purchase_receipt',
  sourceTable: 'purchase_receipts',
  sourceItemsTable: 'purchase_receipt_items',
  sourceItemFk: 'purchase_receipt_id',
  sourceDetailSelect: '*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number), items:purchase_receipt_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['confirmed'],
  sourceNumberField: 'receipt_number',

  targetType: 'supplier_invoice',
  targetTable: 'supplier_invoices',
  targetItemsTable: 'supplier_invoice_items',
  targetItemFk: 'supplier_invoice_id',

  headerMapping: (src) => ({
    supplier_id: src.supplier_id,
    purchase_order_id: src.purchase_order_id,
    currency: (src.purchase_order as any)?.currency,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    tax_rate: 0,
    purchase_receipt_item_id: item.id,
    purchase_order_item_id: item.purchase_order_item_id,
  }),

  quantityField: 'quantity',
  // open qty: receipt item qty minus qty already invoiced referencing this receipt item

  targetSourceFk: undefined,
  targetItemSourceItemFk: 'purchase_receipt_item_id',

  sequenceName: 'supplier_invoice',
  relationLabel: 'Receipt → Supplier Invoice',
};

// ─── SO → Sales Shipment ───
const soToShipment: DocumentFlowConfig = {
  sourceType: 'sales_order',
  sourceTable: 'sales_orders',
  sourceItemsTable: 'sales_order_items',
  sourceItemFk: 'sales_order_id',
  sourceDetailSelect: '*, customer:customers(id,name), items:sales_order_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['approved', 'shipping'],
  sourceNumberField: 'order_number',

  targetType: 'sales_shipment',
  targetTable: 'sales_shipments',
  targetItemsTable: 'sales_shipment_items',
  targetItemFk: 'sales_shipment_id',

  headerMapping: (src) => ({
    customer_id: src.customer_id,
    sales_order_id: src.id,
    warehouse_id: src.warehouse_id,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    sales_order_item_id: item.id,
  }),

  quantityField: 'quantity',
  fulfilledFields: ['shipped_quantity'],

  targetSourceFk: 'sales_order_id',
  targetItemSourceItemFk: 'sales_order_item_id',

  sequenceName: 'sales_shipment',
  relationLabel: 'SO → Shipment',
};

// ─── SO → Sales Invoice ───
const soToSalesInvoice: DocumentFlowConfig = {
  sourceType: 'sales_order',
  sourceTable: 'sales_orders',
  sourceItemsTable: 'sales_order_items',
  sourceItemFk: 'sales_order_id',
  sourceDetailSelect: '*, customer:customers(id,name), items:sales_order_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['approved', 'shipping', 'shipped'],
  sourceNumberField: 'order_number',

  targetType: 'sales_invoice',
  targetTable: 'sales_invoices',
  targetItemsTable: 'sales_invoice_items',
  targetItemFk: 'sales_invoice_id',

  headerMapping: (src) => ({
    customer_id: src.customer_id,
    sales_order_id: src.id,
    currency: src.currency,
    payment_terms: src.payment_terms,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate ?? 0,
    discount_rate: item.discount_rate ?? 0,
    sales_order_item_id: item.id,
  }),

  quantityField: 'quantity',
  fulfilledFields: ['invoiced_quantity'],

  targetSourceFk: 'sales_order_id',
  targetItemSourceItemFk: 'sales_order_item_id',

  sequenceName: 'sales_invoice',
  relationLabel: 'SO → Sales Invoice',
};

// ─── Sales Shipment → Sales Invoice ───
const shipmentToSalesInvoice: DocumentFlowConfig = {
  sourceType: 'sales_shipment',
  sourceTable: 'sales_shipments',
  sourceItemsTable: 'sales_shipment_items',
  sourceItemFk: 'sales_shipment_id',
  sourceDetailSelect: '*, customer:customers(id,name), sales_order:sales_orders(id,order_number,currency,payment_terms), items:sales_shipment_items(*, product:products(id,name,code,uom))',
  sourceValidStatuses: ['confirmed'],
  sourceNumberField: 'shipment_number',

  targetType: 'sales_invoice',
  targetTable: 'sales_invoices',
  targetItemsTable: 'sales_invoice_items',
  targetItemFk: 'sales_invoice_id',

  headerMapping: (src) => ({
    customer_id: src.customer_id,
    sales_order_id: src.sales_order_id,
    currency: (src.sales_order as any)?.currency,
    payment_terms: (src.sales_order as any)?.payment_terms,
  }),
  itemMapping: (item, openQty) => ({
    product_id: item.product_id,
    quantity: openQty,
    unit_price: item.unit_price,
    tax_rate: 0,
    discount_rate: 0,
    sales_shipment_item_id: item.id,
    sales_order_item_id: item.sales_order_item_id,
  }),

  quantityField: 'quantity',
  // open qty: shipment item qty minus qty already invoiced referencing this shipment item

  targetSourceFk: undefined,
  targetItemSourceItemFk: 'sales_shipment_item_id',

  sequenceName: 'sales_invoice',
  relationLabel: 'Shipment → Sales Invoice',
};

export const DOCUMENT_FLOWS: DocumentFlowConfig[] = [
  prToPo,
  poToReceipt,
  poToSupplierInvoice,
  receiptToSupplierInvoice,
  soToShipment,
  soToSalesInvoice,
  shipmentToSalesInvoice,
];

export function findFlow(sourceType: string, targetType: string): DocumentFlowConfig | undefined {
  return DOCUMENT_FLOWS.find((f) => f.sourceType === sourceType && f.targetType === targetType);
}
