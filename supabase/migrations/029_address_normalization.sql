-- 029: Address normalization
-- Remove inline address fields from customers (address lives in customer_addresses table)

-- 1. Customers: add default_address_id FK, then drop inline address columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_address_id UUID REFERENCES customer_addresses(id);

ALTER TABLE customers DROP COLUMN IF EXISTS address;
ALTER TABLE customers DROP COLUMN IF EXISTS city;
ALTER TABLE customers DROP COLUMN IF EXISTS province;
ALTER TABLE customers DROP COLUMN IF EXISTS postal_code;
ALTER TABLE customers DROP COLUMN IF EXISTS country;
