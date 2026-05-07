-- Add total_amount to purchase_receipts and recalculate totals from line items.

-- 1. Add total_amount column to purchase_receipts (was missing)
ALTER TABLE purchase_receipts
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0;

-- 2. purchase_requisitions: recalculate from purchase_requisition_lines
UPDATE purchase_requisitions pr
SET total_amount = COALESCE(sub.total, 0)
FROM (
  SELECT purchase_requisition_id,
         SUM(CASE WHEN amount > 0 THEN amount ELSE quantity * unit_price END) AS total
  FROM purchase_requisition_lines
  WHERE deleted_at IS NULL
  GROUP BY purchase_requisition_id
) sub
WHERE pr.id = sub.purchase_requisition_id
  AND pr.deleted_at IS NULL;

-- 3. sales_returns: recalculate from sales_return_items
UPDATE sales_returns sr
SET total_amount = COALESCE(sub.total, 0)
FROM (
  SELECT sales_return_id,
         SUM(CASE WHEN amount > 0 THEN amount ELSE quantity * unit_price END) AS total
  FROM sales_return_items
  WHERE deleted_at IS NULL
  GROUP BY sales_return_id
) sub
WHERE sr.id = sub.sales_return_id
  AND sr.deleted_at IS NULL;

-- 4. purchase_receipts: recalculate from purchase_receipt_items
UPDATE purchase_receipts pr
SET total_amount = COALESCE(sub.total, 0)
FROM (
  SELECT purchase_receipt_id,
         SUM(CASE WHEN amount > 0 THEN amount ELSE quantity * unit_price END) AS total
  FROM purchase_receipt_items
  GROUP BY purchase_receipt_id
) sub
WHERE pr.id = sub.purchase_receipt_id
  AND pr.deleted_at IS NULL;
