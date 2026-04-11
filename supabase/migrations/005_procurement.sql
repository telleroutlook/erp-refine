-- 005_procurement.sql
-- Full P2P: Requisition → RFQ → Quotation → PO → Receipt → Invoice → Payment

-- Purchase requisitions
CREATE TABLE public.purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  requisition_number TEXT NOT NULL,
  requester_id UUID NOT NULL REFERENCES employees(id),
  department_id UUID REFERENCES departments(id),
  required_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  total_amount NUMERIC(18,2) DEFAULT 0 CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'converted', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, requisition_number)
);

CREATE INDEX idx_purchase_requisitions_org ON purchase_requisitions(organization_id);
CREATE INDEX idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX idx_purchase_requisitions_date ON purchase_requisitions(required_date);

-- Purchase requisition lines
CREATE TABLE public.purchase_requisition_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit TEXT NOT NULL DEFAULT 'EA',
  estimated_unit_price NUMERIC(18,4) CHECK (estimated_unit_price >= 0),
  suggested_supplier_id UUID REFERENCES suppliers(id),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_lines_pr ON purchase_requisition_lines(purchase_requisition_id);

-- RFQ (Request for Quotation)
CREATE TABLE public.rfq_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  rfq_number TEXT NOT NULL,
  purchase_requisition_id UUID REFERENCES purchase_requisitions(id),
  title TEXT NOT NULL,
  description TEXT,
  submission_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'closed', 'awarded', 'cancelled')),
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, rfq_number)
);

CREATE INDEX idx_rfq_headers_org ON rfq_headers(organization_id);
CREATE INDEX idx_rfq_headers_status ON rfq_headers(status);

-- RFQ lines
CREATE TABLE public.rfq_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_header_id UUID NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit TEXT NOT NULL DEFAULT 'EA',
  specifications TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfq_lines_header ON rfq_lines(rfq_header_id);

-- Supplier quotations
CREATE TABLE public.supplier_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  quotation_number TEXT NOT NULL,
  rfq_header_id UUID REFERENCES rfq_headers(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  total_amount NUMERIC(18,2) DEFAULT 0 CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_terms INTEGER,
  delivery_days INTEGER,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'under_review', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, quotation_number),
  CHECK (valid_until IS NULL OR valid_until >= quotation_date)
);

CREATE INDEX idx_supplier_quotations_org ON supplier_quotations(organization_id);
CREATE INDEX idx_supplier_quotations_supplier ON supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotations_rfq ON supplier_quotations(rfq_header_id);

-- Supplier quotation lines
CREATE TABLE public.supplier_quotation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
  rfq_line_id UUID REFERENCES rfq_lines(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate >= 0),
  amount NUMERIC(18,2) GENERATED ALWAYS AS (ROUND(qty * unit_price, 2)) STORED,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sq_lines_quotation ON supplier_quotation_lines(supplier_quotation_id);

-- Purchase orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_quotation_id UUID REFERENCES supplier_quotations(id),
  purchase_requisition_id UUID REFERENCES purchase_requisitions(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  warehouse_id UUID REFERENCES warehouses(id),
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_terms INTEGER,
  shipping_method TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'in_transit', 'partially_received',
                      'received', 'invoiced', 'closed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  decision_id UUID,  -- FK to agent_decisions (added later)
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, order_number),
  CHECK (expected_date IS NULL OR expected_date >= order_date)
);

CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  received_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  invoiced_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (invoiced_qty >= 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate >= 0),
  tax_code_id UUID REFERENCES tax_codes(id),
  amount NUMERIC(18,2) GENERATED ALWAYS AS (ROUND(qty * unit_price, 2)) STORED,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- Auto-calculate PO totals
CREATE OR REPLACE FUNCTION fn_calc_po_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = COALESCE((
    SELECT SUM(ROUND(qty * unit_price, 2)) FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id) AND deleted_at IS NULL
  ), 0),
  tax_amount = COALESCE((
    SELECT SUM(ROUND(qty * unit_price * tax_rate / 100, 2)) FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id) AND deleted_at IS NULL
  ), 0)
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_po_items_calc AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION fn_calc_po_totals();

-- Purchase receipts (goods receipt)
CREATE TABLE public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  receipt_number TEXT NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  confirmed_by UUID REFERENCES employees(id),
  confirmed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, receipt_number)
);

CREATE INDEX idx_purchase_receipts_org ON purchase_receipts(organization_id);
CREATE INDEX idx_purchase_receipts_po ON purchase_receipts(purchase_order_id);
CREATE INDEX idx_purchase_receipts_date ON purchase_receipts(receipt_date);

-- Purchase receipt items
CREATE TABLE public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  lot_number TEXT,
  serial_number TEXT,
  storage_location_id UUID REFERENCES storage_locations(id),
  inspection_required BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_items_receipt ON purchase_receipt_items(purchase_receipt_id);

-- Supplier invoices
CREATE TABLE public.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invoice_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'received', 'verified', 'approved', 'paid', 'disputed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  verified_by UUID REFERENCES employees(id),
  verified_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, invoice_number),
  CHECK (due_date IS NULL OR due_date >= invoice_date)
);

CREATE INDEX idx_supplier_invoices_org ON supplier_invoices(organization_id);
CREATE INDEX idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_due_date ON supplier_invoices(due_date);

-- Supplier invoice items
CREATE TABLE public.supplier_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate >= 0),
  amount NUMERIC(18,2) GENERATED ALWAYS AS (ROUND(qty * unit_price, 2)) STORED,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_si_items_invoice ON supplier_invoice_items(supplier_invoice_id);

-- Three-way match results
CREATE TABLE public.three_way_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  purchase_receipt_id UUID REFERENCES purchase_receipts(id),
  supplier_invoice_id UUID REFERENCES supplier_invoices(id),
  match_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending', 'matched', 'price_variance', 'qty_variance', 'exception')),
  po_amount NUMERIC(18,2),
  receipt_amount NUMERIC(18,2),
  invoice_amount NUMERIC(18,2),
  variance_amount NUMERIC(18,2),
  resolution TEXT,
  resolved_by UUID REFERENCES employees(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_three_way_match_po ON three_way_match_results(purchase_order_id);
CREATE INDEX idx_three_way_match_status ON three_way_match_results(match_status);

-- Payment requests
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  request_number TEXT NOT NULL,
  supplier_invoice_id UUID NOT NULL REFERENCES supplier_invoices(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount > 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  ok_to_pay BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT DEFAULT 'bank_transfer',
  requested_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'paid', 'rejected', 'cancelled')),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, request_number)
);

CREATE INDEX idx_payment_requests_org ON payment_requests(organization_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_supplier ON payment_requests(supplier_id);

-- Triggers
CREATE TRIGGER trg_purchase_requisitions_updated BEFORE UPDATE ON purchase_requisitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rfq_headers_updated BEFORE UPDATE ON rfq_headers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_supplier_quotations_updated BEFORE UPDATE ON supplier_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_purchase_order_items_updated BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_purchase_receipts_updated BEFORE UPDATE ON purchase_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_supplier_invoices_updated BEFORE UPDATE ON supplier_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_three_way_match_updated BEFORE UPDATE ON three_way_match_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payment_requests_updated BEFORE UPDATE ON payment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
