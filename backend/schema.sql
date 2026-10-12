CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  buyer_name TEXT,
  phone TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount = 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  checkout_token_hash TEXT NOT NULL,
  mpesa_receipt TEXT,
  result_description TEXT,
  license_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_request_id ON orders(checkout_request_id);
CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(order_id),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
