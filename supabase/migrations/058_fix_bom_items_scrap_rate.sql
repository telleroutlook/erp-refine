-- 058_fix_bom_items_scrap_rate.sql
-- Normalize bom_items.scrap_rate from whole-number percent to decimal fraction
-- (API code treats scrap_rate as 0.0–1.0; seed data had 5 meaning 5%, not 500%)
-- Update DB constraint to match API expectation.

UPDATE bom_items SET scrap_rate = scrap_rate / 100 WHERE scrap_rate >= 1;

ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_scrap_rate_check;
ALTER TABLE bom_items ADD CONSTRAINT bom_items_scrap_rate_check
  CHECK (scrap_rate >= 0 AND scrap_rate < 1);
