-- 006_sales.sql
-- Full O2C: Order → Shipment → Invoice → Return → Receipt

-- Sales orders
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  contract_id UUID,  -- FK to contracts added later
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  warehouse_id UUID REFERENCES warehouses(id),
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_terms INTEGER,
  shipping_method TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'approved', 'shipping', 'shipped',
                      'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, order_number),
  CHECK (delivery_date IS NULL OR delivery_date >= order_date)
);

CREATE INDEX idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_payment_status ON sales_orders(payment_status);

-- Sales order items
CREATE TABLE public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  shipped_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate >= 0),
  tax_code_id UUID REFERENCES tax_codes(id),
  discount_rate NUMERIC(5,2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  amount NUMERIC(18,2) GENERATED ALWAYS AS (ROUND(qty * unit_price * (1 - COALESCE(discount_rate, 0) / 100), 2)) STORED,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_items_so ON sales_order_items(sales_order_id);
CREATE INDEX idx_so_items_product ON sales_order_items(product_id);

-- Auto-calculate SO totals
CREATE OR REPLACE FUNCTION fn_calc_so_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sales_orders
  SET total_amount = COALESCE((
    SELECT SUM(ROUND(qty * unit_price * (1 - COALESCE(discount_rate, 0) / 100), 2))
    FROM sales_order_items
    WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id) AND deleted_at IS NULL
  ), 0),
  tax_amount = COALESCE((
    SELECT SUM(ROUND(qty * unit_price * (1 - COALESCE(discount_rate, 0) / 100) * tax_rate / 100, 2))
    FROM sales_order_items
    WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id) AND deleted_at IS NULL
  ), 0)
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_so_items_calc AFTER INSERT OR UPDATE OR DELETE ON sales_order_items
  FOR EACH ROW EXECUTE FUNCTION fn_calc_so_totals();

-- Sales shipments
CREATE TABLE public.sales_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  shipment_number TEXT NOT NULL,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  carrier_id UUID REFERENCES carriers(id),
  shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tracking_number TEXT,
  shipping_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'picked', 'packed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  confirmed_by UUID REFERENCES employees(id),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, shipment_number)
);

CREATE INDEX idx_sales_shipments_org ON sales_shipments(organization_id);
CREATE INDEX idx_sales_shipments_so ON sales_shipments(sales_order_id);
CREATE INDEX idx_sales_shipments_status ON sales_shipments(status);
CREATE INDEX idx_sales_shipments_date ON sales_shipments(shipment_date);

-- Sales shipment items
CREATE TABLE public.sales_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_shipment_id UUID NOT NULL REFERENCES sales_shipments(id) ON DELETE CASCADE,
  sales_order_item_id UUID REFERENCES sales_order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  lot_number TEXT,
  serial_number TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_items_shipment ON sales_shipment_items(sales_shipment_id);

-- Sales invoices
CREATE TABLE public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invoice_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'voided', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, invoice_number),
  CHECK (due_date IS NULL OR due_date >= invoice_date)
);

CREATE INDEX idx_sales_invoices_org ON sales_invoices(organization_id);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_due_date ON sales_invoices(due_date);

-- Sales invoice items
CREATE TABLE public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  sales_order_item_id UUID REFERENCES sales_order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate >= 0),
  amount NUMERIC(18,2) GENERATED ALWAYS AS (ROUND(qty * unit_price, 2)) STORED,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_si_items_sales_invoice ON sales_invoice_items(sales_invoice_id);

-- Sales returns
CREATE TABLE public.sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  return_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warehouse_id UUID REFERENCES warehouses(id),
  reason TEXT,
  total_amount NUMERIC(18,2) DEFAULT 0 CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'received', 'inspected', 'refunded', 'rejected', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, return_number)
);

CREATE INDEX idx_sales_returns_org ON sales_returns(organization_id);
CREATE INDEX idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX idx_sales_returns_status ON sales_returns(status);

-- Sales return items
CREATE TABLE public.sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
  sales_order_item_id UUID REFERENCES sales_order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(18,4) CHECK (unit_price >= 0),
  reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sr_items_return ON sales_return_items(sales_return_id);

-- Customer receipts (AR collection)
CREATE TABLE public.customer_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  receipt_number TEXT NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_invoice_id UUID REFERENCES sales_invoices(id),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_method TEXT DEFAULT 'bank_transfer',
  bank_reference TEXT,
  notes TEXT,
  received_by UUID REFERENCES employees(id),
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, receipt_number)
);

CREATE INDEX idx_customer_receipts_org ON customer_receipts(organization_id);
CREATE INDEX idx_customer_receipts_customer ON customer_receipts(customer_id);
CREATE INDEX idx_customer_receipts_date ON customer_receipts(receipt_date);

-- Triggers
CREATE TRIGGER trg_sales_orders_updated BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_order_items_updated BEFORE UPDATE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_shipments_updated BEFORE UPDATE ON sales_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_invoices_updated BEFORE UPDATE ON sales_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_returns_updated BEFORE UPDATE ON sales_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customer_receipts_updated BEFORE UPDATE ON customer_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
