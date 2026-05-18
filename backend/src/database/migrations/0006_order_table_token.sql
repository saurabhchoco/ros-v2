ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS
    table_number varchar(20) DEFAULT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS
    token_number varchar(20) DEFAULT NULL;