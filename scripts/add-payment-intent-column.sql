ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
