CREATE TABLE IF NOT EXISTS orders (
  id                BIGSERIAL PRIMARY KEY,
  order_number      VARCHAR(20) UNIQUE NOT NULL,  -- e.g. "AEJ-2026-00001"
  status            VARCHAR(30) NOT NULL DEFAULT 'pending',
                    -- pending | confirmed | in_production | shipped | delivered | cancelled
  -- Customer
  customer_name     VARCHAR(200) NOT NULL,
  customer_email    VARCHAR(200) NOT NULL,
  customer_phone    VARCHAR(50),
  company_name      VARCHAR(200),
  vat_id            VARCHAR(50),
  -- Address
  address           VARCHAR(300),
  postal_code       VARCHAR(20),
  city              VARCHAR(100),
  country           VARCHAR(10) DEFAULT 'PL',
  -- Shipping
  shipping_method   VARCHAR(30),   -- inpost | dhl | personal
  shipping_cost     NUMERIC(10,2) DEFAULT 0,
  -- Pricing
  subtotal_netto    NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate          NUMERIC(5,4) NOT NULL DEFAULT 0.23,
  vat_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_brutto      NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(10) DEFAULT 'PLN',
  -- Cart snapshot (full JSON for audit trail)
  cart_snapshot     JSONB,
  -- Meta
  notes             TEXT,
  admin_note        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_by        VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  item_type         VARCHAR(30) DEFAULT 'print3d',
  stl_filename      VARCHAR(500),
  stl_dims          JSONB,        -- {x, y, z} in mm
  stl_volume_cm3    NUMERIC(12,4),
  material          VARCHAR(100),
  segment           VARCHAR(50),
  colors            JSONB,        -- array of {id, name, hex}
  color_descriptions TEXT,
  infill            VARCHAR(100),
  precision_label   VARCHAR(100),
  color_count       INTEGER DEFAULT 1,
  qty               INTEGER NOT NULL DEFAULT 1,
  unit_price_netto  NUMERIC(10,2) DEFAULT 0,
  currency          VARCHAR(10) DEFAULT 'PLN',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Auto-generate order_number on insert
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'AEJ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();
