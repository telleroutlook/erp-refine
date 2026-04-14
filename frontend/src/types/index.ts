// Common TypeScript types for the frontend

export interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  total_amount: number;
  currency: string;
  supplier?: { id: string; name: string; code: string };
  items?: PurchaseOrderItem[];
  notes?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  line_number: number;
  product?: { id: string; name: string; code: string };
  qty: number;
  unit_price: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  total_amount: number;
  currency: string;
  customer?: { id: string; name: string; code: string };
  created_at: string;
}

export interface StockRecord {
  id: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available?: number;
  product?: { id: string; name: string; code: string };
  warehouse?: { id: string; name: string; code: string };
}
