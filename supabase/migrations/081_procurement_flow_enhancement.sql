-- 081: Enhance procurement flow - add contract linkage and document trail
-- Adds: quotation → contract → PO full traceability
-- Adds: PR → PO source tracking with line-level granularity

-- 1. purchase_orders: link to contract and source requisition
ALTER TABLE purchase_orders
  ADD COLUMN contract_id UUID REFERENCES contracts(id),
  ADD COLUMN source_requisition_id UUID REFERENCES purchase_requisitions(id);

COMMENT ON COLUMN purchase_orders.contract_id IS 'Optional procurement contract this PO is executed under';
COMMENT ON COLUMN purchase_orders.source_requisition_id IS 'Purchase requisition that generated this PO';

-- 2. purchase_order_items: link to contract item and PR line
ALTER TABLE purchase_order_items
  ADD COLUMN contract_item_id UUID REFERENCES contract_items(id),
  ADD COLUMN contract_unit_price NUMERIC(15,2),
  ADD COLUMN requisition_line_id UUID REFERENCES purchase_requisition_lines(id);

COMMENT ON COLUMN purchase_order_items.contract_item_id IS 'Contract line item this PO line references';
COMMENT ON COLUMN purchase_order_items.contract_unit_price IS 'Contract-agreed unit price for variance tracking';
COMMENT ON COLUMN purchase_order_items.requisition_line_id IS 'Source PR line that originated this PO line';

-- 3. contracts: link to source quotation and RFQ
ALTER TABLE contracts
  ADD COLUMN source_quotation_id UUID REFERENCES supplier_quotations(id),
  ADD COLUMN source_rfq_id UUID REFERENCES rfq_headers(id);

COMMENT ON COLUMN contracts.source_quotation_id IS 'Supplier quotation this contract was created from';
COMMENT ON COLUMN contracts.source_rfq_id IS 'RFQ that initiated the quotation/contract process';

-- 4. contract_items: link to source quotation line
ALTER TABLE contract_items
  ADD COLUMN source_quotation_line_id UUID REFERENCES supplier_quotation_lines(id);

COMMENT ON COLUMN contract_items.source_quotation_line_id IS 'Quotation line this contract item was derived from';

-- 5. supplier_quotations: add "contracted" status
ALTER TABLE supplier_quotations
  DROP CONSTRAINT supplier_quotations_status_check;

ALTER TABLE supplier_quotations
  ADD CONSTRAINT supplier_quotations_status_check
  CHECK (status IN ('received', 'evaluated', 'selected', 'contracted', 'rejected'));

-- 6. Indexes for common query patterns
CREATE INDEX idx_purchase_orders_contract_id ON purchase_orders(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_purchase_orders_source_requisition_id ON purchase_orders(source_requisition_id) WHERE source_requisition_id IS NOT NULL;
CREATE INDEX idx_purchase_order_items_contract_item_id ON purchase_order_items(contract_item_id) WHERE contract_item_id IS NOT NULL;
CREATE INDEX idx_purchase_order_items_requisition_line_id ON purchase_order_items(requisition_line_id) WHERE requisition_line_id IS NOT NULL;
CREATE INDEX idx_contracts_source_quotation_id ON contracts(source_quotation_id) WHERE source_quotation_id IS NOT NULL;
CREATE INDEX idx_contract_items_source_quotation_line_id ON contract_items(source_quotation_line_id) WHERE source_quotation_line_id IS NOT NULL;

-- 7. Helper: find active procurement contracts for a product
CREATE OR REPLACE FUNCTION find_active_contracts_for_product(
  p_organization_id UUID,
  p_product_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  contract_id UUID,
  contract_number TEXT,
  supplier_id UUID,
  unit_price NUMERIC,
  quantity NUMERIC,
  remaining_quantity NUMERIC,
  currency TEXT,
  end_date DATE
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS contract_id,
    c.contract_number,
    c.party_id AS supplier_id,
    ci.unit_price,
    ci.quantity,
    ci.quantity - COALESCE(
      (SELECT SUM(poi.quantity)
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       WHERE poi.contract_item_id = ci.id
         AND po.status NOT IN ('cancelled', 'rejected')
         AND po.deleted_at IS NULL),
      0
    ) AS remaining_quantity,
    c.currency,
    c.end_date::DATE
  FROM contracts c
  JOIN contract_items ci ON ci.contract_id = c.id AND ci.deleted_at IS NULL
  WHERE c.organization_id = p_organization_id
    AND c.contract_type = 'procurement'
    AND c.party_type = 'supplier'
    AND c.status = 'active'
    AND c.deleted_at IS NULL
    AND ci.product_id = p_product_id
    AND (c.start_date IS NULL OR c.start_date::DATE <= p_date)
    AND (c.end_date IS NULL OR c.end_date::DATE >= p_date)
  ORDER BY ci.unit_price ASC;
$$;

COMMENT ON FUNCTION find_active_contracts_for_product IS 'Find active procurement contracts for a product, ordered by price. Used during PR→PO conversion to determine supplier.';
